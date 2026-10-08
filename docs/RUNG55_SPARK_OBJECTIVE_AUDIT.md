# Rung 55 — SPARK Objective Failure Audit

Rung 54 completed twelve real Ollama playtests under the same governed
SPARK source, grants and task budgets. The results were:

| Model | Move east | Dash | Lumen Pulse |
| --- | ---: | ---: | ---: |
| qwen2.5:0.5b-instruct | 0/2 | 2/2 | 0/2 |
| llama3.2:1b | 2/2 | 2/2 | 0/2 |

This **does not** by itself explain why a task failed.

## Investigation question

When the model fails the Pulse objective, did it:

1. never propose `PULSE`;
2. propose it, but fail the governance gate;
3. get through governance, but fail transport;
4. reach the bridge, but have no successful Pulse event;
5. emit a Pulse event without a canonical power-use increase?

Those are materially different failure classes.

Rung 55 avoids an expensive repeat experiment. It downloads the full original
[GitHub Actions run 37719857491](https://github.com/MichaelWave369/SparkTheSubstrate/actions/runs/37719857491)
per-model trial artifacts and walks actual model proposals, authorized actions,
submitted intents, direct semantic events, canonical initial/final observations,
and scored task outcomes.

It **does not** fabricate motives or fill gaps in the observed receipts.

## Engine control

In parallel with the evidence audit, the workflow reruns the existing canonical
`runtime-bridge.test.mjs` on the **exact SPARK revision used in Rung 54**.
That test includes a direct `PULSE` positive control asserting:

- `SPARK_PULSE_USED` event;
- canonical power-use counter increases;
- vessel cooldown becomes positive.

A passing positive control demonstrates the engine/bridge can execute Pulse in
the frozen test state. It does **not** establish that either hosted model
proposed Pulse in its own trials.

## Output

`spark.objective-failure-audit.v1`

Each of the 12 trials is classified only from its recorded evidence:

- `OBJECTIVE_MET`
- `PULSE_NOT_PROPOSED`
- `ACTION_REJECTED_BY_AUTHORITY`
- `PULSE_NOT_TRANSPORTED`
- `PULSE_EVENT_NOT_OBSERVED`
- `PULSE_COUNTER_EVENT_MISMATCH`
- `EAST_ACTION_NOT_PROPOSED`
- `EAST_ACTION_NO_PROGRESS`
- `DASH_NOT_PROPOSED`
- `DASH_EVENT_NOT_OBSERVED`
- `DASH_COUNTER_EVENT_MISMATCH`

If artifacts, schemas, objective strings, model digests or canonical progress
disagree, the audit fails rather than inventing a classification.

Each trial records observed button counts, submitted intent types,
semantic events and the original objective outcome. The aggregate explicitly
sets `automatedRoutingPermitted: false`.

## Files

- `scripts/audit_spark_objective_failures.py`
- `tests/test_spark_objective_failure_audit.py`
- `.github/workflows/rung55-spark-objective-audit.yml`

Artifact:

`rung55-spark-objective-failure-audit`

## Next step

Use the resulting classifications to decide which narrowly scoped change is
justified. If no model proposed Pulse, the next experiment belongs in the
objective/policy prompt or model decision layer. If a submitted Pulse failed to
execute, investigate PhiCade/PixelForge/SPARK governance and transport instead.

Do not modify model-routing preferences until the mechanism is understood.
