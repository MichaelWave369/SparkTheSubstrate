"""Synthetic contract checks for Rung 59. No synthetic gameplay results count as evidence."""

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
SPEC = importlib.util.spec_from_file_location(
    "compare_spark_affordance_ab", SCRIPTS / "compare_spark_affordance_ab.py"
)
ab = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ab)
import compare_spark_cooldown_ab as common


def fixture(model, digest, task, revision, success=False):
    observation = {
        "schema": "phicade.spark-semantic-observation.v1",
        "phase": "playing",
        "tick": 0,
        "player": {"hp": 112.0, "dashReady": False},
        "powerCooldown": 0.0,
        "allowedActions": ["MOVE", "DASH", "PULSE"],
    }
    turns = []
    for turn_id in range(5):
        o = {**observation, "tick": turn_id}
        turns.append({
            "observation": o,
            "availableButtons": sorted(common.available_from_observation(o)),
            "providerResponse": {
                "actions": [{
                    "delayFrames": 0,
                    "action": {"kind": "button", "button": "RIGHT", "pressed": True},
                }],
            },
            "directEvents": [],
        })
    objective = common.EXPECTED_OBJECTIVES[task]
    receipt = {
        "schema": "phicade.spark-ollama-playtest.v2",
        "recordStatus": "PASS",
        "model": model,
        "modelDigest": digest,
        "phicadeRevision": revision,
        "sparkRevision": common.SPARK_SHA,
        "pixelforgeRevision": common.PIXELFORGE_SHA,
        "requestedTurns": 5,
        "objective": objective,
        "turns": turns,
    }
    score = {
        "schema": "phicade.spark-task-scored-playtest.v1",
        "recordStatus": "PASS",
        "model": model,
        "modelDigest": digest,
        "task": {"taskId": task, "objective": objective, "success": success, "progress": 0.0},
    }
    return receipt, score


class AffordanceComparisonContractTests(unittest.TestCase):
    def build_fixture(self, root, baseline_success=False, after_success=True):
        for safe, (model, digest) in common.MODELS.items():
            for task in common.TASKS:
                for repetition in common.REPETITIONS:
                    stem = f"{task}-repeat{repetition}"
                    for side, prefix, revision, success in (
                        ("baseline", "rung57", ab.BASELINE_PHICADE, baseline_success),
                        ("treatment", "rung59", ab.TREATMENT_PHICADE, after_success),
                    ):
                        path = root / side / f"{prefix}-{safe}"
                        receipt, scored = fixture(model, digest, task, revision, success)
                        common.write(path / f"{stem}.playtest.json", receipt)
                        common.write(path / f"{stem}.scored.json", scored)

    def test_comparison_keeps_six_task_pairs_and_never_grants_routing(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.build_fixture(root)
            output = ab.compare(root / "baseline", root / "treatment")
            self.assertEqual(output["recordStatus"], "EVIDENCE_COMPLETE")
            self.assertFalse(output["automaticRoutingPermitted"])
            self.assertEqual(output["modelRanking"], "NOT_ESTABLISHED")
            self.assertEqual(len(output["models"]), 2)
            for model in output["models"]:
                self.assertEqual(len(model["tasks"]), 3)
                for task in model["tasks"]:
                    self.assertEqual(task["deltaSuccesses"], 2)
                    self.assertEqual(task["deltaPulseProposals"], 0)
                    self.assertEqual(task["baseline"]["denominator"], 2)
                    self.assertEqual(task["affordanceGuide"]["denominator"], 2)
            rendered = ab.markdown_report(output)
            self.assertIn("Before Pulse proposals", rendered)
            self.assertIn("After Pulse proposals", rendered)
            self.assertIn("0/2", rendered)
            self.assertIn("2/2", rendered)

    def test_baseline_and_treatment_both_require_real_ready_button_menus(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.build_fixture(root)
            folder = root / "baseline" / "rung57-qwen2.5-0.5b-instruct"
            path = folder / "use-pulse-repeat1.playtest.json"
            receipt = common.load(path)
            del receipt["turns"][0]["availableButtons"]
            common.write(path, receipt)
            with self.assertRaisesRegex(ValueError, "missing or duplicated availableButtons"):
                ab.compare(root / "baseline", root / "treatment")

    def test_new_trials_must_use_exact_pinned_phicade_version(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.build_fixture(root)
            folder = root / "treatment" / "rung59-llama3.2-1b"
            path = folder / "move-east-repeat1.playtest.json"
            receipt = common.load(path)
            receipt["phicadeRevision"] = "0" * 40
            common.write(path, receipt)
            with self.assertRaisesRegex(ValueError, "wrong PhiCade revision"):
                ab.compare(root / "baseline", root / "treatment")

    def test_missing_receipt_is_not_counted_as_a_failed_task(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.build_fixture(root)
            path = (root / "treatment" / "rung59-llama3.2-1b"
                    / "use-dash-repeat2.scored.json")
            path.unlink()
            with self.assertRaises(FileNotFoundError):
                ab.compare(root / "baseline", root / "treatment")


if __name__ == "__main__":
    unittest.main()
