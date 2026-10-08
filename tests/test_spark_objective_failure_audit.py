"""Contract tests for the evidence-only Rung 55 SPARK action audit."""
import importlib.util
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
import json

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "audit_spark_objective_failures.py"
SPEC = importlib.util.spec_from_file_location("audit_spark_objective_failures", SCRIPT)
audit = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(audit)


def sample(task="use-pulse", buttons=("RIGHT",), progress=0, success=False):
    model = "qwen2.5:0.5b-instruct"
    digest = audit.MODELS["qwen2.5-0.5b-instruct"]["digest"]
    initial = {
        "tick": 0, "player": {"x": 480.0}, "dashes": 0, "powers": 0,
    }
    final = {
        "tick": 1,
        "player": {"x": 480.0 + (progress if task == "move-east" else 0)},
        "dashes": progress if task == "use-dash" else 0,
        "powers": progress if task == "use-pulse" else 0,
    }
    turns = [{
        "providerResponse": {
            "actions": [{
                "delayFrames": 0,
                "action": {"kind": "button", "button": b, "pressed": True},
            } for b in buttons],
        },
        "authorityDecision": {"accepted": True} if buttons else None,
        "submittedIntent": {
            "actorId": "spark",
            "type": "PULSE" if "PULSE" in buttons else
                    "DASH" if any(b.startswith("DASH_") for b in buttons) else "MOVE",
        } if buttons else None,
        "directEvents": [{"type": "SPARK_PULSE_USED"}] if progress and task == "use-pulse" else [],
    }]
    objective = f"frozen objective {task}"
    receipt = {
        "schema": "phicade.spark-ollama-playtest.v2",
        "recordStatus": "PASS",
        "model": model, "modelDigest": digest, "objective": objective,
        "requestedTurns": 1, "turns": turns,
        "initialObservation": initial,
        "finalObservation": final,
    }
    score = {
        "schema": "phicade.spark-task-scored-playtest.v1",
        "recordStatus": "PASS",
        "model": model, "modelDigest": digest,
        "task": {
            "taskId": task, "objective": objective,
            "success": success, "progress": progress,
        },
    }
    return model, digest, receipt, score


class ObjectiveAuditTests(unittest.TestCase):
    def test_absent_pulse_is_a_proposal_failure_not_engine_failure(self):
        model, digest, receipt, score = sample()
        result = audit.audit_pair("use-pulse", model, digest, receipt, score)
        self.assertEqual(result["resultClass"], "PULSE_NOT_PROPOSED")
        self.assertEqual(result["chosenButtons"], {"RIGHT": 1})

    def test_pulse_event_without_metric_is_an_inconsistency(self):
        model, digest, receipt, score = sample(buttons=("PULSE",))
        receipt["turns"][0]["directEvents"] = [{"type": "SPARK_PULSE_USED"}]
        result = audit.audit_pair("use-pulse", model, digest, receipt, score)
        self.assertEqual(result["resultClass"], "PULSE_COUNTER_EVENT_MISMATCH")

    def test_explicit_rejection_reasons_are_preserved(self):
        model, digest, receipt, score = sample(buttons=("DASH_DOWN",))
        receipt["turns"][0]["directEvents"] = [{
            "type": "SPARK_ACTION_REJECTED",
            "payload": {"reason": "DASH_COOLDOWN"},
        }]
        result = audit.audit_pair("use-pulse", model, digest, receipt, score)
        self.assertEqual(result["rejectionReasons"], {"DASH_COOLDOWN": 1})
        self.assertEqual(result["resultClass"], "PULSE_NOT_PROPOSED")

    def test_positive_pulse(self):
        model, digest, receipt, score = sample(buttons=("PULSE",), progress=1, success=True)
        result = audit.audit_pair("use-pulse", model, digest, receipt, score)
        self.assertEqual(result["resultClass"], "OBJECTIVE_MET")

    def test_failed_east_action_when_no_east_proposed(self):
        model, digest, receipt, score = sample(task="move-east", buttons=("UP",))
        result = audit.audit_pair("move-east", model, digest, receipt, score)
        self.assertEqual(result["resultClass"], "EAST_ACTION_NOT_PROPOSED")

    def test_east_with_actual_progress(self):
        model, digest, receipt, score = sample(
            task="move-east", buttons=("RIGHT",), progress=3.0, success=True
        )
        result = audit.audit_pair("move-east", model, digest, receipt, score)
        self.assertEqual(result["resultClass"], "OBJECTIVE_MET")

    def test_does_not_reinterpret_mismatched_digest(self):
        model, digest, receipt, score = sample()
        receipt["modelDigest"] = "0" * 64
        with self.assertRaisesRegex(ValueError, "model identity"):
            audit.audit_pair("use-pulse", model, digest, receipt, score)

    def test_scorer_disagreement_is_rejected(self):
        model, digest, receipt, score = sample()
        score["task"]["progress"] = 1
        with self.assertRaisesRegex(ValueError, "progress differs"):
            audit.audit_pair("use-pulse", model, digest, receipt, score)

    def test_fail_closed_when_missing_trial_evidence(self):
        with tempfile.TemporaryDirectory() as root:
            with self.assertRaisesRegex(ValueError, "expected exactly one"):
                audit.build_audit(Path(root))


if __name__ == "__main__":
    unittest.main()
