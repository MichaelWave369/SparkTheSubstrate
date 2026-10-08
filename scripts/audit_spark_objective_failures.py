#!/usr/bin/env python3
"""Audit real Rung 54 SPARK model actions against scored task outcomes.

No inference, model routing, or score substitution. Reads prior CI artifacts.
"""
import argparse
import json
import math
from collections import Counter
from pathlib import Path

SCHEMA = "spark.objective-failure-audit.v1"
RUN_ID = "37719857491"
MODELS = {
    "qwen2.5-0.5b-instruct": {
        "name": "qwen2.5:0.5b-instruct",
        "digest": "a8b0c51577010a279d933d14c2a8ab4b268079d44c5c8830c0a93900f1827c67",
    },
    "llama3.2-1b": {
        "name": "llama3.2:1b",
        "digest": "baf6a787fdffd633537aa2eb51cfd54cb93ff08e28040095462bb63daf552878",
    },
}
TASKS = ("move-east", "use-dash", "use-pulse")
REPETITIONS = (1, 2)


def read_json(path):
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def find_one(folder, name):
    matches = list(folder.rglob(name))
    if len(matches) != 1:
        raise ValueError(
            f"expected exactly one {name} in {folder}, found {len(matches)}"
        )
    return matches[0]


def finite_number(value, field):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError(f"{field} must be finite numeric")
    return value


def chosen_buttons(turns):
    buttons = []
    for turn in turns:
        for proposal in turn.get("providerResponse", {}).get("actions", []):
            action = proposal.get("action", {})
            if action.get("kind") != "button":
                raise ValueError(f"unexpected provider action kind: {action.get('kind')}")
            if not action.get("pressed"):
                raise ValueError("unpressed button in a successful SPARK turn")
            buttons.append(action.get("button"))
    return buttons


def submitted_types(turns):
    return [
        turn["submittedIntent"]["type"]
        for turn in turns
        if isinstance(turn.get("submittedIntent"), dict)
    ]


def semantic_event_types(turns):
    return [
        event["type"]
        for turn in turns for event in turn.get("directEvents", [])
    ]


def diagnose(task, success, buttons, submissions, events, turns, progress):
    if success:
        return "OBJECTIVE_MET"
    if task == "use-pulse":
        if "PULSE" not in buttons:
            return "PULSE_NOT_PROPOSED"
        rejected = any(
            turn.get("authorityDecision", {}).get("accepted") is False
            for turn in turns if turn.get("authorityDecision")
        )
        if rejected:
            return "ACTION_REJECTED_BY_AUTHORITY"
        if "PULSE" not in submissions:
            return "PULSE_NOT_TRANSPORTED"
        if "SPARK_PULSE_USED" not in events:
            return "PULSE_EVENT_NOT_OBSERVED"
        return "PULSE_COUNTER_EVENT_MISMATCH"
    if task == "move-east":
        return "EAST_ACTION_NO_PROGRESS" if any(
            x in buttons for x in ("RIGHT", "DASH_RIGHT")
        ) else "EAST_ACTION_NOT_PROPOSED"
    if task == "use-dash":
        if not any(b.startswith("DASH_") for b in buttons if isinstance(b, str)):
            return "DASH_NOT_PROPOSED"
        return ("DASH_EVENT_NOT_OBSERVED" if "SPARK_DASH_STARTED" not in events
                else "DASH_COUNTER_EVENT_MISMATCH")
    raise ValueError(f"unknown task {task}")


def audit_pair(task, model, digest, receipt, score):
    if task not in TASKS:
        raise ValueError(f"unsupported task {task}")
    if receipt.get("schema") != "phicade.spark-ollama-playtest.v2":
        raise ValueError("unexpected playtest schema")
    if score.get("schema") != "phicade.spark-task-scored-playtest.v1":
        raise ValueError("unexpected scored schema")
    if receipt.get("recordStatus") != "PASS" or score.get("recordStatus") != "PASS":
        raise ValueError("cannot audit non-PASS playtest or scorer")
    for source in (receipt, score):
        if source.get("model") != model or source.get("modelDigest") != digest:
            raise ValueError("model identity mismatch in evidence")
    task_evidence = score.get("task") or {}
    if task_evidence.get("taskId") != task:
        raise ValueError("score's taskId does not match frozen requested task")
    if receipt.get("objective") != task_evidence.get("objective"):
        raise ValueError("objective mismatch between actual playtest and score")
    if receipt.get("requestedTurns") != len(receipt.get("turns", [])):
        raise ValueError("playtest turn count mismatch")
    initial = receipt["initialObservation"]
    final = receipt["finalObservation"]
    if final["tick"] < initial["tick"]:
        raise ValueError("tick moved backward")
    progress = finite_number(task_evidence["progress"], "progress")
    success = task_evidence["success"]
    if not isinstance(success, bool):
        raise ValueError("task success must be boolean")

    if task == "move-east":
        observed_progress = final["player"]["x"] - initial["player"]["x"]
    elif task == "use-dash":
        observed_progress = final["dashes"] - initial["dashes"]
    else:
        observed_progress = final["powers"] - initial["powers"]
    if abs(finite_number(observed_progress, "observed progress") - progress) > 1e-8:
        raise ValueError("scorer progress differs from initial/final canonical observation")

    turns = receipt["turns"]
    buttons = chosen_buttons(turns)
    submissions = submitted_types(turns)
    events = semantic_event_types(turns)
    rejection_reasons = [
        event.get("payload", {}).get("reason", "UNSPECIFIED")
        for turn in turns
        for event in turn.get("directEvents", [])
        if event.get("type") == "SPARK_ACTION_REJECTED"
    ]
    recorded_submissions = [
        turn["submittedIntent"]
        for turn in turns if isinstance(turn.get("submittedIntent"), dict)
    ]
    authority_accepted = [
        turn["authorityDecision"]["accepted"]
        for turn in turns if isinstance(turn.get("authorityDecision"), dict)
    ]
    if any(value is not True for value in authority_accepted):
        raise ValueError("PASS receipt unexpectedly includes rejected authorized action")
    if len(submissions) != len(authority_accepted):
        raise ValueError("authorized submissions mismatch")
    for intent in recorded_submissions:
        if intent.get("actorId") != "spark" or intent.get("type") not in ("MOVE", "DASH", "PULSE"):
            raise ValueError("unexpected runtime intent in supposedly governed receipt")

    return {
        "taskId": task,
        "success": success,
        "rawProgress": progress,
        "chosenButtons": dict(sorted(Counter(buttons).items())),
        "submittedIntents": dict(sorted(Counter(submissions).items())),
        "semanticEvents": dict(sorted(Counter(events).items())),
        "rejectionReasons": dict(sorted(Counter(rejection_reasons).items())),
        "resultClass": diagnose(task, success, buttons, submissions, events, turns, progress),
        "turns": len(turns),
    }


def build_audit(root):
    results = []
    for safe, ident in MODELS.items():
        folder = root / f"rung54-{safe}"
        trials = []
        for task in TASKS:
            for repetition in REPETITIONS:
                stem = f"{task}-repeat{repetition}"
                receipt = read_json(find_one(folder, f"{stem}.playtest.json"))
                score = read_json(find_one(folder, f"{stem}.scored.json"))
                trial = audit_pair(task, ident["name"], ident["digest"], receipt, score)
                trial["repetition"] = repetition
                trials.append(trial)
        results.append({"model": ident["name"], "modelDigest": ident["digest"], "trials": trials})
    return {
        "schema": SCHEMA,
        "sourceRunId": RUN_ID,
        "recordStatus": "EVIDENCE_AUDITED",
        "totalTrials": sum(len(m["trials"]) for m in results),
        "automatedRoutingPermitted": False,
        "models": results,
    }


def markdown_report(audit):
    lines = [
        "# Rung 55 SPARK Objective Failure Audit",
        "",
        "Source: Rung 54 full-scored evidence artifacts from run " + RUN_ID + ".",
        "This report classifies observed actions; it does not infer the model's reasoning.",
        "",
        "| Model | Task | Trial | Outcome | Class | Buttons | Intents | Events | Rejection reasons |",
        "| --- | --- | ---: | --- | --- | --- | --- | --- | --- |",
    ]
    for model in audit["models"]:
        for t in model["trials"]:
            def fmt(values):
                return ", ".join(f"{k}×{v}" for k, v in values.items()) or "none"
            lines.append(
                f"| {model['model']} | {t['taskId']} | {t['repetition']} | "
                f"{'success' if t['success'] else 'not met'} | {t['resultClass']} | "
                f"{fmt(t['chosenButtons'])} | {fmt(t['submittedIntents'])} | "
                f"{fmt(t['semanticEvents'])} | {fmt(t['rejectionReasons'])} |"
            )
    lines += [
        "",
        "## Interpretation limits",
        "",
        "A task failure is not automatically an execution failure. If the model never",
        "proposed the required action, the trace cannot establish how the runtime",
        "would have behaved if that action had been submitted.",
        "",
        "The separately verified deterministic SPARK bridge positive controls can",
        "establish the direct engine path; they do not certify the entire model",
        "decision or PhiCade governance path on their own.",
        "",
        "No routing weights or permissions are changed by this analysis.",
    ]
    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = build_audit(args.input)
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "objective-failure-audit.json").write_text(
        json.dumps(result, indent=2) + "\n", encoding="utf-8"
    )
    report = markdown_report(result)
    (args.output / "objective-failure-audit.md").write_text(report, encoding="utf-8")
    print(report)


if __name__ == "__main__":
    main()
