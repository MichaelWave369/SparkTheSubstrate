#!/usr/bin/env python3
"""Rung 59: compare real cooldown-aware SPARK trials with action-affordance guidance.

Both arms use the SAME cooldown menu, grants, game, models, objectives and
scorer. The treatment updates PhiCade's SPARK-only control vocabulary prompt.
This observational comparison is not a claim of causality or routing authority.
"""

import argparse
import json
from pathlib import Path

import compare_spark_cooldown_ab as common

BASELINE_RUN = "37742344134"
BASELINE_PHICADE = "ea1f887addeab0c44500f7f5c044fde4e5daa2c6"
TREATMENT_PHICADE = "821e5526d4a6ad9cd1a60d2bb57236f042b5bfbf"
SCHEMA = "spark.semantic-affordance-task-ab.v1"


def compare(baseline: Path, treatment: Path):
    results = []
    for safe, (model, digest) in common.MODELS.items():
        old_dir = common.artifact_folder(baseline, "rung57", safe)
        new_dir = common.artifact_folder(treatment, "rung59", safe)
        tasks = []
        for task in common.TASKS:
            # Both arms have the exact cooldown-filtered menu. Validate both.
            before_trials = [
                common.read_trial(
                    old_dir, task, rep, model, digest, BASELINE_PHICADE, True
                )
                for rep in common.REPETITIONS
            ]
            after_trials = [
                common.read_trial(
                    new_dir, task, rep, model, digest, TREATMENT_PHICADE, True
                )
                for rep in common.REPETITIONS
            ]
            baseline_stats = common.summarize(before_trials)
            affordance_stats = common.summarize(after_trials)
            tasks.append({
                "task": task,
                "baseline": baseline_stats,
                "affordanceGuide": affordance_stats,
                "deltaSuccesses": affordance_stats["successes"] - baseline_stats["successes"],
                "deltaPulseProposals": (
                    affordance_stats["pulseProposals"] - baseline_stats["pulseProposals"]
                ),
                "deltaDashCooldownRejections": (
                    affordance_stats["dashCooldownRejections"]
                    - baseline_stats["dashCooldownRejections"]
                ),
                "baselineTrials": before_trials,
                "guidedTrials": after_trials,
            })
        results.append({"model": model, "modelDigest": digest, "tasks": tasks})

    return {
        "schema": SCHEMA,
        "recordStatus": "EVIDENCE_COMPLETE",
        "sourceBaselineRun": BASELINE_RUN,
        "sourceAdmissionRun": common.ADMISSION_RUN,
        "baselinePhiCadeRevision": BASELINE_PHICADE,
        "guidedPhiCadeRevision": TREATMENT_PHICADE,
        "sparkRevision": common.SPARK_SHA,
        "pixelForgeRevision": common.PIXELFORGE_SHA,
        "repetitionsPerTask": len(common.REPETITIONS),
        "turnBudget": 5,
        "automaticRoutingPermitted": False,
        "modelRanking": "NOT_ESTABLISHED",
        "causalConclusion": "NOT_ESTABLISHED",
        "experimentalContrast": "SPARK_ONLY_ACTION_AFFORDANCE_PROMPT",
        "models": results,
    }


def markdown_report(result):
    lines = [
        "# Rung 59: SPARK Semantic Affordance A/B Comparison",
        "",
        "Original Rung 57 cooldown-aware runs vs fresh Rung 59 runs with explicit",
        "button-to-effect descriptions. Same pinned models, game source, task",
        "strings, readiness filter, five-turn budget and scoring. No causal",
        "inference or BrainC routing authorization is made.",
        "",
        "| Model | Task | Before successes | After successes | Before Pulse proposals | After Pulse proposals | Before DASH_COOLDOWN | After DASH_COOLDOWN |",
        "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for model in result["models"]:
        for item in model["tasks"]:
            old, new = item["baseline"], item["affordanceGuide"]
            lines.append(
                f"| {model['model']} | {item['task']} | "
                f"{old['successes']}/{old['denominator']} | "
                f"{new['successes']}/{new['denominator']} | "
                f"{old['pulseProposals']} | {new['pulseProposals']} | "
                f"{old['dashCooldownRejections']} | "
                f"{new['dashCooldownRejections']} |"
            )
    lines.extend([
        "",
        "## Evidence qualification",
        "",
        "- Both arms verified the exact model identity and pinned source revisions.",
        "- Both arms verified the *full* dynamically available button menu on every turn.",
        "- Actual button proposals, action rejections and score receipts are preserved.",
        "- Completed task failures are legitimate negative evidence.",
        "- No model preference, routing weight or authority was modified.",
        "- Two repetitions per task do not support a general model ranking.",
        "",
    ])
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", required=True, type=Path)
    parser.add_argument("--treatment", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()

    result = compare(args.baseline, args.treatment)
    args.out.mkdir(parents=True, exist_ok=True)
    common.write(args.out / "semantic-affordance-ab.json", result)
    report = markdown_report(result)
    (args.out / "semantic-affordance-ab.md").write_text(report, encoding="utf-8")
    print(report)


if __name__ == "__main__":
    main()
