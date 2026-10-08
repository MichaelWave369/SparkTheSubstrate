#!/usr/bin/env python3
"""Compare actual Rung 54 and cooldown-aware Rung 57 SPARK model receipts.

Read-only evidence analysis. This does not change routing policy, infer a model's
private reasoning, or treat CI runner timing as a controlled latency experiment.
"""

import argparse
import json
from collections import Counter
from pathlib import Path

BASELINE_RUN = "37719857491"
BASELINE_PHICADE = "4cb2d55a8673618ad8cc5b168de096ec899d2c3d"
TREATMENT_PHICADE = "ea1f887addeab0c44500f7f5c044fde4e5daa2c6"
SPARK_SHA = "fae7879820bef63a550fea486b2defbc3cee5304"
PIXELFORGE_SHA = "8790c3b00b5184136fb8fa6a2fbdabe834eeca22"
ADMISSION_RUN = "37673671800"
MODELS = {
    "qwen2.5-0.5b-instruct": (
        "qwen2.5:0.5b-instruct",
        "a8b0c51577010a279d933d14c2a8ab4b268079d44c5c8830c0a93900f1827c67",
    ),
    "llama3.2-1b": (
        "llama3.2:1b",
        "baf6a787fdffd633537aa2eb51cfd54cb93ff08e28040095462bb63daf552878",
    ),
}
TASKS = ("move-east", "use-dash", "use-pulse")
REPETITIONS = (1, 2)
DIRECTIONS = ("UP", "DOWN", "LEFT", "RIGHT")
DASHES = tuple("DASH_" + d for d in DIRECTIONS)
STATIC_GRANT = set(DIRECTIONS + DASHES + ("PULSE",))
EXPECTED_OBJECTIVES = {
    "move-east": "Move east as far as you can using only the granted gameplay controls.",
    "use-dash": "Use a dash successfully at least once using only the granted gameplay controls.",
    "use-pulse": "Use Lumen Pulse successfully at least once using only the granted gameplay controls.",
}


def load(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def write(path, obj):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def artifact_folder(root, prefix, safe):
    target = Path(root) / f"{prefix}-{safe}"
    if not target.is_dir():
        raise ValueError(f"expected artifact directory {target}")
    return target


def available_from_observation(observation):
    if observation.get("phase") != "playing":
        raise ValueError("cannot offer controls in a non-playing phase")
    if observation.get("player", {}).get("hp", 0) <= 0:
        raise ValueError("cannot offer controls to fallen vessel")
    supported = set(observation["allowedActions"])
    if not supported.issubset({"MOVE", "DASH", "PULSE"}):
        raise ValueError("unknown runtime capability")
    ready = set(DIRECTIONS) if "MOVE" in supported else set()
    if "DASH" in supported and observation["player"]["dashReady"] is True:
        ready.update(DASHES)
    power = observation["powerCooldown"]
    if not isinstance(power, (float, int)) or isinstance(power, bool) or power < 0:
        raise ValueError("invalid power cooldown")
    if "PULSE" in supported and power == 0:
        ready.add("PULSE")
    return ready & STATIC_GRANT


def read_trial(folder, task, rep, model, digest, phicade, treatment):
    stem = f"{task}-repeat{rep}"
    receipt = load(folder / f"{stem}.playtest.json")
    scored = load(folder / f"{stem}.scored.json")
    if receipt.get("schema") != "phicade.spark-ollama-playtest.v2":
        raise ValueError(f"{folder}/{stem}: unknown playtest schema")
    if scored.get("schema") != "phicade.spark-task-scored-playtest.v1":
        raise ValueError(f"{folder}/{stem}: unknown scored receipt schema")
    if receipt.get("recordStatus") != "PASS" or scored.get("recordStatus") != "PASS":
        raise ValueError(f"{folder}/{stem}: not a PASS receipt pair")
    for entry in (receipt, scored):
        if entry.get("model") != model or entry.get("modelDigest") != digest:
            raise ValueError(f"{folder}/{stem}: wrong model identity")
    if receipt.get("phicadeRevision") != phicade:
        raise ValueError(f"{folder}/{stem}: wrong PhiCade revision")
    if receipt.get("sparkRevision") != SPARK_SHA or receipt.get("pixelforgeRevision") != PIXELFORGE_SHA:
        raise ValueError(f"{folder}/{stem}: game source/transport pins changed")
    if receipt.get("requestedTurns") != 5 or len(receipt.get("turns", [])) != 5:
        raise ValueError(f"{folder}/{stem}: turn budget changed")
    if receipt.get("objective") != EXPECTED_OBJECTIVES[task]:
        raise ValueError(f"{folder}/{stem}: model objective changed")
    score = scored.get("task", {})
    if score.get("taskId") != task or score.get("objective") != EXPECTED_OBJECTIVES[task]:
        raise ValueError(f"{folder}/{stem}: scorer objective changed")
    if not isinstance(score.get("success"), bool):
        raise ValueError(f"{folder}/{stem}: missing task success")

    buttons = Counter()
    rejected = Counter()
    events = Counter()
    offered_sets = []
    available_rule_checks = 0
    for turn in receipt["turns"]:
        observation = turn["observation"]
        if treatment:
            offered = turn.get("availableButtons")
            if not isinstance(offered, list) or len(offered) != len(set(offered)):
                raise ValueError(f"{folder}/{stem}: missing or duplicated availableButtons")
            expected = available_from_observation(observation)
            if set(offered) != expected:
                raise ValueError(
                    f"{folder}/{stem}: model menu {sorted(offered)} differs from "
                    f"observed ready controls {sorted(expected)}"
                )
            available_rule_checks += 1
            offered_sets.append(sorted(offered))
        elif "availableButtons" in turn:
            raise ValueError(f"{folder}/{stem}: baseline unexpectedly includes treatment menu")
        for action in turn.get("providerResponse", {}).get("actions", []):
            button = action.get("action", {}).get("button")
            if not isinstance(button, str):
                raise ValueError(f"{folder}/{stem}: missing proposal button")
            if treatment and button not in offered:
                raise ValueError(f"{folder}/{stem}: model proposed unavailable {button}")
            buttons[button] += 1
        for event in turn.get("directEvents", []):
            event_type = event.get("type")
            if not isinstance(event_type, str):
                raise ValueError(f"{folder}/{stem}: malformed event")
            events[event_type] += 1
            if event_type == "SPARK_ACTION_REJECTED":
                rejected[event.get("payload", {}).get("reason", "UNSPECIFIED")] += 1
    if treatment and available_rule_checks != 5:
        raise ValueError(f"{folder}/{stem}: not all model menus checked")
    return {
        "task": task,
        "rep": rep,
        "success": score["success"],
        "progress": score["progress"],
        "buttons": dict(sorted(buttons.items())),
        "rejectReasons": dict(sorted(rejected.items())),
        "eventTypes": dict(sorted(events.items())),
        "pulseProposals": buttons["PULSE"],
        "dashProposals": sum(buttons[d] for d in DASHES),
        "dashCooldownRejections": rejected["DASH_COOLDOWN"],
        "offeredMenus": offered_sets if treatment else None,
        "modelDigest": digest,
    }


def summarize(trials):
    return {
        "successes": sum(1 for t in trials if t["success"]),
        "denominator": len(trials),
        "pulseProposals": sum(t["pulseProposals"] for t in trials),
        "dashProposals": sum(t["dashProposals"] for t in trials),
        "dashCooldownRejections": sum(t["dashCooldownRejections"] for t in trials),
        "progressValues": [t["progress"] for t in trials],
    }


def compare(baseline, treatment):
    output = []
    for safe, (model, digest) in MODELS.items():
        before = artifact_folder(baseline, "rung54", safe)
        after = artifact_folder(treatment, "rung57", safe)
        tasks = []
        for task in TASKS:
            original_trials = [
                read_trial(before, task, rep, model, digest, BASELINE_PHICADE, False)
                for rep in REPETITIONS
            ]
            new_trials = [
                read_trial(after, task, rep, model, digest, TREATMENT_PHICADE, True)
                for rep in REPETITIONS
            ]
            old_sum = summarize(original_trials)
            new_sum = summarize(new_trials)
            tasks.append({
                "task": task,
                "baseline": old_sum,
                "cooldownAware": new_sum,
                "deltaSuccesses": new_sum["successes"] - old_sum["successes"],
                "deltaDashCooldownRejections": (
                    new_sum["dashCooldownRejections"] - old_sum["dashCooldownRejections"]
                ),
                "originalTrials": original_trials,
                "treatmentTrials": new_trials,
            })
        output.append({"model": model, "digest": digest, "tasks": tasks})

    return {
        "schema": "spark.cooldown-aware-task-ab.v1",
        "status": "EVIDENCE_COMPLETE",
        "sourceBaselineRun": BASELINE_RUN,
        "admissionRun": ADMISSION_RUN,
        "baselinePhiCadeRevision": BASELINE_PHICADE,
        "treatmentPhiCadeRevision": TREATMENT_PHICADE,
        "sparkRevision": SPARK_SHA,
        "pixelForgeRevision": PIXELFORGE_SHA,
        "runsPerModel": 6,
        "turnsPerRun": 5,
        "automaticRoutingPermitted": False,
        "causalConclusion": "NOT_ESTABLISHED",
        "modelRanking": "NOT_ESTABLISHED",
        "models": output,
    }


def report(data):
    lines = [
        "# Rung 57: Cooldown-Aware SPARK A/B Receipt Comparison",
        "",
        "Original Rung 54 runs vs new Rung 57 independent fresh model runs.",
        "Both arms use the same game source and frozen objectives, but different",
        "PhiCade model-facing menu/prompt code. **Causality is not established.**",
        "",
        "| Model | Task | Before successes | After successes | Before DASH_COOLDOWN | After DASH_COOLDOWN | After Pulse proposals |",
        "| --- | --- | ---: | ---: | ---: | ---: | ---: |",
    ]
    for model in data["models"]:
        for task in model["tasks"]:
            before, after = task["baseline"], task["cooldownAware"]
            lines.append(
                f"| {model['model']} | {task['task']} | "
                f"{before['successes']}/{before['denominator']} | "
                f"{after['successes']}/{after['denominator']} | "
                f"{before['dashCooldownRejections']} | "
                f"{after['dashCooldownRejections']} | "
                f"{after['pulseProposals']} |"
            )
    lines += [
        "",
        "## Evidence guards",
        "",
        "- Every trial must contain the exact source/model digests and same task strings.",
        "- Every treatment turn must expose the complete currently ready action menu.",
        "- Every treatment proposal must belong to the menu actually offered.",
        "- Rejection causes are read directly from SPARK's event ledger.",
        "- No automatic BrainC/PhiCade routing changes are authorized.",
        "",
    ]
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", type=Path, required=True)
    parser.add_argument("--treatment", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    data = compare(args.baseline, args.treatment)
    args.out.mkdir(parents=True, exist_ok=True)
    write(args.out / "cooldown-aware-ab.json", data)
    md = report(data)
    (args.out / "cooldown-aware-ab.md").write_text(md, encoding="utf-8")
    print(md)


if __name__ == "__main__":
    main()
