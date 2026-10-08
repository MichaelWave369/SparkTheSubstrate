"""Pure, no-model acceptance checks for Rung 54 task-matrix orchestration."""

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "hosted_spark_task_matrix.py"
SPEC = importlib.util.spec_from_file_location("hosted_spark_task_matrix", SCRIPT)
matrix = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(matrix)

QWEN = "qwen2.5:0.5b-instruct"
DIGEST = "a" * 64


class TaskMatrixContractTests(unittest.TestCase):
    def test_unadmitted_and_mismatched_digest_models_are_rejected(self):
        admissions = {
            "schema": "phicade.model-admission-set.v1",
            "sourceSchema": "spark.isolated-model-identity-matrix.v1",
            "admissions": [{
                "model": QWEN,
                "disposition": "ELIGIBLE",
                "admittedDigest": DIGEST,
            }],
        }
        self.assertEqual(matrix.admission_for(admissions, QWEN, DIGEST)["model"], QWEN)
        with self.assertRaises(ValueError):
            matrix.admission_for(admissions, "gemma3:1b", DIGEST)
        with self.assertRaises(ValueError):
            matrix.admission_for(admissions, QWEN, "b" * 64)

    def test_incomplete_trials_have_no_success_rate(self):
        trials = [{
            "taskId": "move-east",
            "repetition": 1,
            "status": "SCORED",
            "success": True,
            "progress": 4.0,
            "averageProviderTurnSeconds": 1.0,
        }, {
            "taskId": "move-east",
            "repetition": 2,
            "status": "PLAYTEST_ERROR",
        }]
        data = matrix.summarize_trials(trials)
        self.assertIsNone(data["move-east"]["successRateOfAllAttempts"])
        self.assertEqual(data["move-east"]["scored"], 1)
        self.assertEqual(data["move-east"]["successes"], 1)

    def test_completed_trials_preserve_failure_as_quality_signal(self):
        trials = [{
            "taskId": "use-pulse",
            "repetition": i,
            "status": "SCORED",
            "success": False,
            "progress": 0,
            "averageProviderTurnSeconds": 2.5,
        } for i in (1, 2)]
        data = matrix.summarize_trials(trials)["use-pulse"]
        self.assertEqual(data["successRateOfAllAttempts"], 0)
        self.assertEqual(data["meanProgress"], 0)
        self.assertEqual(data["meanProviderTurnSeconds"], 2.5)

    def test_aggregate_never_grants_routing(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for model, safe in (
                (QWEN, "qwen2.5-0.5b-instruct"),
                ("llama3.2:1b", "llama3.2-1b"),
            ):
                path = root / "evidence" / f"rung54-{safe}" / "summary.json"
                matrix.write_json(path, {
                    "model": model,
                    "schema": "spark.admitted-model-task-trials.v1",
                    "status": "COMPLETE_STABLE",
                    "perTask": {
                        task: {
                            "scored": 2, "successes": 1, "meanProgress": 3.0,
                            "meanProviderTurnSeconds": 2.0,
                        } for task in matrix.TASKS
                    },
                })
            code = matrix.aggregate(SimpleNamespace(
                input=str(root / "evidence"), out=str(root / "out"),
            ))
            self.assertEqual(code, 0)
            output = json.loads((root / "out" / "task-quality-matrix.json").read_text())
            self.assertEqual(output["recordStatus"], "COMPLETE")
            self.assertFalse(output["automaticRoutingPermitted"])
            self.assertEqual(output["qualityRanking"], "NOT_ESTABLISHED")


if __name__ == "__main__":
    unittest.main()
