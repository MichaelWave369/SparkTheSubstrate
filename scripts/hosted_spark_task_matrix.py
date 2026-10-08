#!/usr/bin/env python3
"""Rung 54: repeat admitted Ollama models on frozen, canonically scored SPARK microtasks.

No model is granted authority by this tool. PhiCade still authorizes each action.
Uses only the Python standard library.
"""

import argparse
import json
import math
import subprocess
import sys
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

SOURCE_MATRIX_RUN = "37673671800"
TASKS = {
    "move-east": "Move east as far as you can using only the granted gameplay controls.",
    "use-dash": "Use a dash successfully at least once using only the granted gameplay controls.",
    "use-pulse": "Use Lumen Pulse successfully at least once using only the granted gameplay controls.",
}
REPETITIONS = 2
TURN_BUDGET = 5
TRIAL_TIMEOUT_SECONDS = 240


def read_json(path):
    with Path(path).open(encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path, obj):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def current_digest(model):
    with urllib.request.urlopen("http://127.0.0.1:11434/api/tags", timeout=15) as response:
        data = json.load(response)
    matches = [
        item["digest"]
        for item in data.get("models", [])
        if model in (item.get("name"), item.get("model"))
    ]
    if len(matches) != 1:
        raise RuntimeError(f"expected one installed Ollama model {model!r}, got {len(matches)}")
    return matches[0]


def admission_for(admissions, model, expected_digest):
    if admissions.get("schema") != "phicade.model-admission-set.v1":
        raise ValueError("not a PhiCade model-admission-set.v1 receipt")
    if admissions.get("sourceSchema") != "spark.isolated-model-identity-matrix.v1":
        raise ValueError("admission set does not derive from Rung 51 isolated evidence")
    matches = [a for a in admissions["admissions"] if a.get("model") == model]
    if len(matches) != 1:
        raise ValueError(f"model {model!r} must have exactly one admissibility entry")
    admitted = matches[0]
    if admitted.get("disposition") != "ELIGIBLE":
        raise ValueError(f"model {model!r} is not admitted: {admitted.get('disposition')}")
    if admitted.get("admittedDigest") != expected_digest:
        raise ValueError(
            f"frozen admission digest differs for {model!r}: "
            f"{admitted.get('admittedDigest')} != {expected_digest}"
        )
    if len(expected_digest) != 64 or not all(c in "0123456789abcdef" for c in expected_digest):
        raise ValueError("expected digest is not canonical 64-character lowercase hex")
    return admitted


def command_capture(command, log, cwd, timeout=TRIAL_TIMEOUT_SECONDS):
    log = Path(log)
    log.parent.mkdir(parents=True, exist_ok=True)
    try:
        completed = subprocess.run(
            command,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
        log.write_text(
            "$ " + " ".join(map(str, command)) + "\n\n"
            + completed.stdout + "\n" + completed.stderr,
            encoding="utf-8",
        )
        return completed.returncode
    except subprocess.TimeoutExpired as exc:
        stdout = exc.stdout or b""
        stderr = exc.stderr or b""
        if isinstance(stdout, bytes):
            stdout = stdout.decode("utf-8", errors="replace")
        if isinstance(stderr, bytes):
            stderr = stderr.decode("utf-8", errors="replace")
        log.write_text(
            f"TIMEOUT after {timeout}s\n{stdout}\n{stderr}",
            encoding="utf-8",
        )
        return 124


def summarize_trials(trials):
    output = {}
    for task in TASKS:
        items = [t for t in trials if t["taskId"] == task]
        complete = [t for t in items if t["status"] == "SCORED"]
        successes = sum(bool(t.get("success")) for t in complete)
        durations = [t["averageProviderTurnSeconds"] for t in complete
                     if isinstance(t.get("averageProviderTurnSeconds"), (float, int))]
        progress = [t["progress"] for t in complete
                    if isinstance(t.get("progress"), (float, int))
                    and math.isfinite(t["progress"])]
        output[task] = {
            "attempts": len(items),
            "scored": len(complete),
            "successes": successes,
            "successRateOfAllAttempts": (
                successes / REPETITIONS if len(items) == REPETITIONS and len(complete) == REPETITIONS
                else None
            ),
            "meanProgress": sum(progress) / len(progress) if progress else None,
            "meanProviderTurnSeconds": sum(durations) / len(durations) if durations else None,
        }
    return output


def run_model(args):
    output = Path(args.out).resolve()
    output.mkdir(parents=True, exist_ok=True)
    evidence = {
        "schema": "spark.admitted-model-task-trials.v1",
        "model": args.model,
        "expectedDigest": args.digest,
        "sourceAdmissionRun": SOURCE_MATRIX_RUN,
        "turnBudget": TURN_BUDGET,
        "repetitionsPerTask": REPETITIONS,
        "createdAtUtc": datetime.now(timezone.utc).isoformat(),
        "tasks": list(TASKS),
        "trials": [],
        "status": "INCOMPLETE",
    }
    try:
        admission_for(read_json(args.admissions), args.model, args.digest)
        before_digest = current_digest(args.model)
        evidence["digestBefore"] = before_digest
        if before_digest != args.digest:
            raise RuntimeError("installed model digest does not match Rung 51 admission")

        phicade = Path(args.phicade).resolve()
        pixelforge = Path(args.pixelforge).resolve()
        spark = Path(args.spark).resolve()
        example_root = phicade / "target" / "debug" / "examples"
        playtest_bin = example_root / "qualify_spark_ollama"
        scorer_bin = example_root / "score_spark_playtest"
        for tool in (playtest_bin, scorer_bin):
            if not tool.is_file():
                raise RuntimeError(f"required compiled PhiCade example missing: {tool}")

        for task_id, objective in TASKS.items():
            for repetition in range(1, REPETITIONS + 1):
                stem = f"{task_id}-repeat{repetition}"
                trial = {
                    "taskId": task_id,
                    "repetition": repetition,
                    "objective": objective,
                    "status": "INCOMPLETE",
                }
                evidence["trials"].append(trial)

                if current_digest(args.model) != args.digest:
                    raise RuntimeError(f"identity drift before {stem}")

                playtest_path = output / f"{stem}.playtest.json"
                log = output / f"{stem}.playtest.log"
                code = command_capture(
                    [str(playtest_bin),
                     "--pixelforge-root", str(pixelforge),
                     "--spark-root", str(spark),
                     "--model", args.model,
                     "--turns", str(TURN_BUDGET),
                     "--objective", objective,
                     "--out", str(playtest_path)],
                    log, phicade,
                )
                trial["playtestExitCode"] = code
                trial["playtestLog"] = log.name
                if current_digest(args.model) != args.digest:
                    raise RuntimeError(f"identity drift after {stem}")

                if code != 0 or not playtest_path.is_file():
                    trial["status"] = "PLAYTEST_ERROR"
                    continue

                playtest = read_json(playtest_path)
                if playtest.get("schema") != "phicade.spark-ollama-playtest.v2":
                    trial["status"] = "INVALID_RECEIPT_SCHEMA"
                    continue
                if playtest.get("model") != args.model or playtest.get("modelDigest") != args.digest:
                    raise RuntimeError(f"model identity in playtest receipt disagrees with admission at {stem}")
                if playtest.get("recordStatus") != "PASS":
                    trial["status"] = "PLAYTEST_NOT_PASS"
                    continue
                if playtest.get("objective") != objective:
                    trial["status"] = "OBJECTIVE_MISMATCH"
                    continue

                scored_path = output / f"{stem}.scored.json"
                score_log = output / f"{stem}.score.log"
                score_code = command_capture(
                    [str(scorer_bin),
                     "--input", str(playtest_path),
                     "--task", task_id,
                     "--out", str(scored_path)],
                    score_log, phicade, timeout=60,
                )
                trial["scoreExitCode"] = score_code
                trial["scoreLog"] = score_log.name
                if score_code != 0 or not scored_path.is_file():
                    trial["status"] = "SCORER_ERROR"
                    continue

                scored = read_json(scored_path)
                task = scored.get("task") or {}
                if scored.get("schema") != "phicade.spark-task-scored-playtest.v1":
                    trial["status"] = "INVALID_SCORE_SCHEMA"
                    continue
                if task.get("taskId") != task_id or task.get("objective") != objective:
                    trial["status"] = "INVALID_TASK_IDENTITY"
                    continue
                if scored.get("model") != args.model or scored.get("modelDigest") != args.digest:
                    trial["status"] = "INVALID_MODEL_IDENTITY"
                    continue
                trial.update({
                    "status": "SCORED",
                    "success": task["success"],
                    "progress": task["progress"],
                    "metricName": task["metricName"],
                    "averageProviderTurnSeconds": scored.get("averageProviderTurnSeconds"),
                    "totalEvalCount": scored.get("totalEvalCount"),
                    "scoredReceipt": scored_path.name,
                    "playtestReceipt": playtest_path.name,
                })

        after_digest = current_digest(args.model)
        evidence["digestAfter"] = after_digest
        if after_digest != args.digest:
            raise RuntimeError("installed model digest changed across task suite")

        scores = summarize_trials(evidence["trials"])
        evidence["perTask"] = scores
        evidence["status"] = (
            "COMPLETE_STABLE"
            if len(evidence["trials"]) == len(TASKS) * REPETITIONS
            and all(t["status"] == "SCORED" for t in evidence["trials"])
            else "INCOMPLETE"
        )
    except Exception as exc:
        evidence["status"] = "INCOMPLETE"
        evidence["error"] = str(exc)
    finally:
        evidence.setdefault("perTask", summarize_trials(evidence["trials"]))
        write_json(output / "summary.json", evidence)

    print(json.dumps({
        "model": args.model,
        "status": evidence["status"],
        "perTask": evidence["perTask"],
        "error": evidence.get("error"),
    }, indent=2))
    return 0 if evidence["status"] == "COMPLETE_STABLE" else 1


def aggregate(args):
    root = Path(args.input).resolve()
    models = [
        ("qwen2.5:0.5b-instruct", "qwen2.5-0.5b-instruct"),
        ("llama3.2:1b", "llama3.2-1b"),
    ]
    results = []
    for model, safe in models:
        path = root / f"rung54-{safe}" / "summary.json"
        if not path.is_file():
            results.append({"model": model, "status": "MISSING", "perTask": {}})
            continue
        entry = read_json(path)
        if entry.get("model") != model or entry.get("schema") != "spark.admitted-model-task-trials.v1":
            results.append({"model": model, "status": "INVALID", "perTask": {}})
            continue
        results.append(entry)
    complete = all(entry.get("status") == "COMPLETE_STABLE" for entry in results)
    matrix = {
        "schema": "spark.admitted-task-quality-matrix.v1",
        "recordStatus": "COMPLETE" if complete else "INCOMPLETE",
        "automaticRoutingPermitted": False,
        "admissionEvidenceRun": SOURCE_MATRIX_RUN,
        "perTaskRepetitions": REPETITIONS,
        "turnsPerTrial": TURN_BUDGET,
        "qualityRanking": "NOT_ESTABLISHED",
        "models": results,
    }
    output = Path(args.out).resolve()
    output.mkdir(parents=True, exist_ok=True)
    write_json(output / "task-quality-matrix.json", matrix)
    lines = [
        "# Rung 54 Governed SPARK Task-Quality Matrix",
        "",
        "These scores are task-local evidence, not general intelligence rankings.",
        "",
        "| Model | Task | Scored trials | Task success | Mean raw progress | Mean provider turn (s) |",
        "| --- | --- | ---: | ---: | ---: | ---: |",
    ]
    for model in results:
        for task_id in TASKS:
            score = model.get("perTask", {}).get(task_id, {})
            successes = score.get("successes", 0)
            scored = score.get("scored", 0)
            progress = score.get("meanProgress")
            duration = score.get("meanProviderTurnSeconds")
            lines.append(
                f"| {model['model']} | {task_id} | {scored}/{REPETITIONS} | "
                f"{successes}/{REPETITIONS} | "
                f"{progress:.4f}" if False else ""
            )
            lines.pop()
            lines.append(
                f"| {model['model']} | {task_id} | {scored}/{REPETITIONS} | "
                f"{successes}/{REPETITIONS} | "
                f"{progress:.4f}" if isinstance(progress, (float, int)) else
                f"| {model['model']} | {task_id} | {scored}/{REPETITIONS} | {successes}/{REPETITIONS} | —"
            )
            lines[-1] += (
                f" | {duration:.3f} |" if isinstance(duration, (float, int)) else " | — |"
            )
    lines.extend([
        "",
        f"Matrix status: **{matrix['recordStatus']}**. ",
        "No weights, model preference or automatic route was changed.",
        "",
    ])
    (output / "task-quality-matrix.md").write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines))
    return 0 if complete else 1


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="mode", required=True)
    run = sub.add_parser("run")
    run.add_argument("--model", required=True)
    run.add_argument("--digest", required=True)
    run.add_argument("--admissions", required=True)
    run.add_argument("--phicade", required=True)
    run.add_argument("--pixelforge", required=True)
    run.add_argument("--spark", required=True)
    run.add_argument("--out", required=True)
    group = sub.add_parser("aggregate")
    group.add_argument("--input", required=True)
    group.add_argument("--out", required=True)
    args = parser.parse_args()
    return run_model(args) if args.mode == "run" else aggregate(args)


if __name__ == "__main__":
    sys.exit(main())
