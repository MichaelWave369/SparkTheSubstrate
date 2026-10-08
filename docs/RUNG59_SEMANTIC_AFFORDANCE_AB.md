# Rung 59 — Guided SPARK Action-Vocabulary A/B

The [Rung 57 experiment](https://github.com/MichaelWave369/SparkTheSubstrate/pull/11) removed all 48 baseline `DASH_COOLDOWN` rejections via the bounded, cooldown-aware action menu, but **both models continued to ignore the use-pulse objective**: 0/2 Pulse successes and zero PULSE proposals each.

[PhiCade Rung 58](https://github.com/MichaelWave369/PhiCade/pull/56) is merged green at `821e5526d4a6ad9cd1a60d2bb57236f042b5bfbf`. It added an **objective-neutral, SPARK-only** explanation of the currently available button effects, including `PULSE` as “activate the currently equipped vessel power (Lumen pulse).”

## Controlled before/after comparison

Rung 59 launches 12 new real local-model playtests through isolated GitHub Actions Ollama runners, then compares those receipts to the 12 original Rung 57 trials:

| Fixed setting | Value |
| --- | --- |
| Model A | `qwen2.5:0.5b-instruct`, exact admitted digest |
| Model B | `llama3.2:1b`, exact admitted digest |
| Model admission | Rung 51 evidence, run `37673671800` |
| SPARK bridge | `fae7879820bef63a550fea486b2defbc3cee5304` |
| PixelForge | `8790c3b00b5184136fb8fa6a2fbdabe834eeca22` |
| Baseline PhiCade | `ea1f887addeab0c44500f7f5c044fde4e5daa2c6` |
| Guided PhiCade | `821e5526d4a6ad9cd1a60d2bb57236f042b5bfbf` |
| Initial game | Same deterministic SPARK starting state |
| Objectives | Exactly frozen `move-east`, `use-dash`, `use-pulse` |
| Trials | Two fresh processes per model/objective, five turns each |
| Scorer | The same PhiCade canonical-state task scorer |

Each model runs alone and must qualify against its frozen admission evidence and installed Ollama model digest. The model still proposes actions and PhiCade and SPARK retain final authority.

The **cooldown-aware control menu is unchanged in both experimental arms**. In contrast to the earlier experiment, both baseline and guided receipts include per-turn `availableButtons`. Every recorded menu is independently checked against that turn’s semantic `dashReady`, `powerCooldown`, live phase, static grant, and runtime capabilities. Any proposed unavailable action invalidates the comparison.

## What this actually tests

For each model and task the comparison tracks:

- Baseline and guided objective success (out of two each)
- Baseline and guided **PULSE proposal counts**
- Repeated `DASH_COOLDOWN` rejections
- Turn-by-turn offered menu, chosen control, canonical action outcome, and individual task progress
- Exact model IDs, source revisions, and scoreboard/scorer evidence

The comparison emits `spark.semantic-affordance-task-ab.v1` and explicitly records:

```text
automaticRoutingPermitted: false
modelRanking: NOT_ESTABLISHED
causalConclusion: NOT_ESTABLISHED
```

Even if guided performance improves, the evidence only supports a small, bounded **before/after** comparison, not a general intelligence ranking or definitive causal effect.

## Hosted CI and artifacts

Workflow:
`.github/workflows/rung59-spark-affordance-ab.yml`

Script:
`scripts/compare_spark_affordance_ab.py`

Tests:
`tests/test_compare_spark_affordance_ab.py`

Artifacts:
`rung59-qwen2.5-0.5b-instruct`,
`rung59-llama3.2-1b`,
`rung59-spark-affordance-ab`

Baseline is fetched from real Rung 57 Actions run `37742344134`, not manually entered scoreboard values. This can all run on hosted runners without installing software on the operator’s machine.

## Interpretation

Success requires canonical SPARK state change, not model assertions. A model that produces `PULSE` when the objective requests Lumen Pulse demonstrates bounded input/control matching, not general planning.

Future BrainC routing optimization should be separately governed, with held-out objectives and more than two task repetitions before any task-quality routing conclusions are promoted.
