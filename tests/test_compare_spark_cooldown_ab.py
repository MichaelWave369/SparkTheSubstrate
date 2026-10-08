"""Pure acceptance tests for Rung 57 before/after task evidence comparisons."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "compare_spark_cooldown_ab.py"
SPEC = importlib.util.spec_from_file_location("compare_spark_cooldown_ab", SCRIPT)
ab = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ab)


def observation(dash_ready, power_cooldown):
    return {
        "tick": 1,
        "phase": "playing",
        "player": {"hp": 112, "dashReady": dash_ready},
        "powerCooldown": power_cooldown,
        "allowedActions": ["MOVE", "DASH", "PULSE"],
    }


def fixtures(task="use-pulse", treatment=True, offered=None, proposal="RIGHT"):
    model, digest = ab.MODELS["qwen2.5-0.5b-instruct"]
    obs = observation(False, 0)
    offered = offered if offered is not None else ["UP", "DOWN", "LEFT", "RIGHT", "PULSE"]
    turns = []
    for n in range(5):
        turn = {
            "observation": {**obs, "tick": n},
            "providerResponse": {
                "actions": [{
                    "action": {"kind": "button", "button": proposal, "pressed": True},
                    "delayFrames": 0,
                }],
            },
            "directEvents": [],
        }
        if treatment:
            turn["availableButtons"] = offered
        turns.append(turn)
    receipt = {
        "schema": "phicade.spark-ollama-playtest.v2",
        "recordStatus": "PASS",
        "model": model,
        "modelDigest": digest,
        "phicadeRevision": ab.TREATMENT_PHICADE if treatment else ab.BASELINE_PHICADE,
        "sparkRevision": ab.SPARK_SHA,
        "pixelforgeRevision": ab.PIXELFORGE_SHA,
        "requestedTurns": 5,
        "objective": ab.EXPECTED_OBJECTIVES[task],
        "turns": turns,
    }
    scored = {
        "schema": "phicade.spark-task-scored-playtest.v1",
        "recordStatus": "PASS",
        "model": model,
        "modelDigest": digest,
        "task": {
            "taskId": task, "objective": ab.EXPECTED_OBJECTIVES[task],
            "success": False, "progress": 0.0,
        },
    }
    return model, digest, receipt, scored


class BeforeAfterAuditTests(unittest.TestCase):
    def test_menu_hides_dashes_but_preserves_ready_pulse(self):
        self.assertEqual(
            ab.available_from_observation(observation(False, 0)),
            set(ab.DIRECTIONS + ("PULSE",)),
        )
        self.assertEqual(
            ab.available_from_observation(observation(True, 2.5)),
            set(ab.DIRECTIONS + ab.DASHES),
        )
        with self.assertRaises(ValueError):
            ab.available_from_observation(observation(False, -1.0))

    def test_new_receipt_proposal_must_be_in_offered_menu(self):
        model, digest, receipt, scored = fixtures()
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            stem = "use-pulse-repeat1"
            ab.write(root / f"{stem}.playtest.json", receipt)
            ab.write(root / f"{stem}.scored.json", scored)
            result = ab.read_trial(
                root, "use-pulse", 1, model, digest, ab.TREATMENT_PHICADE, True,
            )
            self.assertEqual(result["pulseProposals"], 0)
            receipt["turns"][0]["providerResponse"]["actions"][0]["action"]["button"] = "DASH_RIGHT"
            ab.write(root / f"{stem}.playtest.json", receipt)
            with self.assertRaisesRegex(ValueError, "proposed unavailable"):
                ab.read_trial(root, "use-pulse", 1, model, digest, ab.TREATMENT_PHICADE, True)

    def test_menu_cannot_hide_ready_controls(self):
        model, digest, receipt, scored = fixtures(offered=["RIGHT", "PULSE"])
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            stem = "use-pulse-repeat1"
            ab.write(root / f"{stem}.playtest.json", receipt)
            ab.write(root / f"{stem}.scored.json", scored)
            with self.assertRaisesRegex(ValueError, "differs from observed ready controls"):
                ab.read_trial(root, "use-pulse", 1, model, digest, ab.TREATMENT_PHICADE, True)

    def test_cooldown_rejections_are_counted_even_if_trial_passes(self):
        model, digest, receipt, scored = fixtures(treatment=False)
        for turn in receipt["turns"]:
            turn["directEvents"] = [{
                "type": "SPARK_ACTION_REJECTED",
                "payload": {"reason": "DASH_COOLDOWN"},
            }]
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            stem = "use-pulse-repeat1"
            ab.write(root / f"{stem}.playtest.json", receipt)
            ab.write(root / f"{stem}.scored.json", scored)
            result = ab.read_trial(
                root, "use-pulse", 1, model, digest, ab.BASELINE_PHICADE, False,
            )
            self.assertEqual(result["dashCooldownRejections"], 5)

    def test_wrong_phicade_revision_fails_closed(self):
        model, digest, receipt, scored = fixtures()
        receipt["phicadeRevision"] = "0" * 40
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            stem = "use-pulse-repeat1"
            ab.write(root / f"{stem}.playtest.json", receipt)
            ab.write(root / f"{stem}.scored.json", scored)
            with self.assertRaisesRegex(ValueError, "wrong PhiCade revision"):
                ab.read_trial(root, "use-pulse", 1, model, digest, ab.TREATMENT_PHICADE, True)

    def test_report_does_not_authorize_routing(self):
        report = ab.report({
            "models": [{
                "model": "qwen2.5:0.5b-instruct",
                "tasks": [{
                    "task": "use-pulse",
                    "baseline": {"successes": 0, "denominator": 2, "dashCooldownRejections": 8},
                    "cooldownAware": {
                        "successes": 2, "denominator": 2,
                        "dashCooldownRejections": 0, "pulseProposals": 2,
                    },
                }],
            }],
        })
        self.assertIn("0/2", report)
        self.assertIn("2/2", report)
        self.assertIn("Causality is not established", report)


if __name__ == "__main__":
    unittest.main()
