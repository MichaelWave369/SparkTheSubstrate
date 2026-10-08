# Rung 57 — Cooldown-Aware SPARK A/B Trial

## Purpose

The merged [Rung 55 SPARK audit](https://github.com/MichaelWave369/SparkTheSubstrate/pull/10)
found that both locally hosted test models repeatedly proposed unavailable
directional DASH actions. The source engine emitted one successful dash and
four `DASH_COOLDOWN` rejections per five-turn test. Neither model proposed
`PULSE` in its Pulse trials.

[PhiCade PR #55](https://github.com/MichaelWave369/PhiCade/pull/55), now merged
at `ea1f887addeab0c44500f7f5c044fde4e5daa2c6`, narrows each semantic
model-facing choice set to currently available granted controls. It does not
alter the static AgentGrant, the underlying SPARK engine, or PixelForge.

Rung 57 evaluates the effect of the new cooldown-aware choice menu using
**actual new model inference**, not a mock and not fabricated results.

## Frozen experimental controls

- **Qwen**: `qwen2.5:0.5b-instruct` at admitted digest
  `a8b0c51577010a279d933d14c2a8ab4b268079d44c5c8830c0a93900f1827c67`
- **Llama**: `llama3.2:1b` at admitted digest
  `baf6a787fdffd633537aa2eb51cfd54cb93ff08e28040095462bb63daf552878`
- Rung 51 **real admission artifact** from run `37673671800`
- Canonical SPARK source `fae7879820bef63a550fea486b2defbc3cee5304`
- PixelForge source `8790c3b00b5184136fb8fa6a2fbdabe834eeca22`
- `move-east`, `use-dash`, `use-pulse`, with exactly the same task strings
  and canonical scorers
- Same fresh initial seed, five turns per trial, two independent repetitions per
  objective, one isolated hosted Ollama runner per model
- Same three task metrics and receipt schemas as Rung 54

This yields twelve treatment trials matched to twelve pre-existing baseline
trials.

The only planned code difference is the PhiCade revision, from:

```text
Rung 54 baseline: 4cb2d55a8673618ad8cc5b168de096ec899d2c3d
Rung 57 treatment: ea1f887addeab0c44500f7f5c044fde4e5daa2c6
```

**Note:** PhiCade #55 modified both the model-facing prompt and filtered JSON
choice schema, and each hosted run occurs in a new environment. This is a
before/after comparison, not a randomized causal experiment; improvement
cannot be attributed uniquely to one subchange.

## Trace requirements

The comparison downloads complete baseline model artifacts from
[run 37719857491](https://github.com/MichaelWave369/SparkTheSubstrate/actions/runs/37719857491)
and treatment artifacts from the new run. It refuses:

- a changed model digest;
- an unexpected PhiCade, PixelForge or SPARK revision;
- a changed objective or turn count;
- missing scored or original playtest receipts;
- invalid or changed schema;
- an impossible/omitted per-turn `availableButtons` menu;
- a proposal outside the offered controls.

The comparison independently derives all currently available controls from the
actual semantic observation, including `dashReady`, `powerCooldown`, active
phase, HP, runtime-supported action kinds, and the static SPARK grant.

## What the report measures

Each model × objective shows:

- before/after successes out of two independent trials;
- before/after direct `DASH_COOLDOWN` rejections;
- how often the model proposed `PULSE`;
- original per-trial progress, selected buttons, and event categories.

The report is versioned as `spark.cooldown-aware-task-ab.v1`, with:

```json
{
  "automaticRoutingPermitted": false,
  "causalConclusion": "NOT_ESTABLISHED",
  "modelRanking": "NOT_ESTABLISHED"
}
```

Those are deliberate limits. This experiment does not automatically update
BrainC, assign routing weights, rank model intelligence, or enable higher
authority.

## CI artifacts

Workflow:

`.github/workflows/rung57-spark-cooldown-ab.yml`

Per-model real trial evidence:

`rung57-qwen2.5-0.5b-instruct`

`rung57-llama3.2-1b`

Comparison artifact:

`rung57-spark-cooldown-ab`

The comparison script is
`scripts/compare_spark_cooldown_ab.py`
and its pure contract tests are
`tests/test_compare_spark_cooldown_ab.py`.

No operator downloads or workstation execution are required.
