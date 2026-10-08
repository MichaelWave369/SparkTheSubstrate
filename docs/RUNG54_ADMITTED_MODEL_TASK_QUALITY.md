# Rung 54 — Admitted SPARK Task-Quality Matrix

The first repeated hosted task-quality trial builds on the evidence gates
already verified in PhiCade and SPARK.

## Strict provenance

The workflow does not assign the label "admitted" based on model names.

It downloads the **actual Rung 51 isolated identity matrix artifact** from
[run 37673671800](https://github.com/MichaelWave369/SparkTheSubstrate/actions/runs/37673671800)
and invokes PhiCade Rung 52's `qualify_model_admission` executable.

Only `ELIGIBLE` model entries with the exact admitted digest are permitted.

The eligible list from that evidence is:

- `qwen2.5:0.5b-instruct`
- `llama3.2:1b`

`gemma3:1b` remains quarantined for identity drift and is not enrolled.
Admission is tied to an exact model digest, not a mutable Ollama tag.

## Repeated real trials

Each admitted model runs in a **fresh isolated runner** with its own Ollama
installation and a single downloaded model.

Each model receives the same frozen:

- SPARK bridge source SHA;
- PixelForge v5.34 SHA;
- PhiCade Rung 53 merge SHA;
- default deterministic SPARK initialization;
- 5-turn budget;
- action grant and semantic projection;
- three objective strings defined by PhiCade's microtask scorer.

The three microtasks are:

- `move-east`: canonical player-X displacement
- `use-dash`: canonical dash counter
- `use-pulse`: canonical power-use counter

Each task repeats **twice from a fresh SPARK process**, for six trials per
model and twelve independent real playtests total.

## No fake grades

Each trial creates a real `phicade.spark-ollama-playtest.v2` receipt, then
PhiCade's `score_spark_playtest` evaluates that receipt.

A valid, completed playtest that fails a task still counts as a completed
**negative task outcome** and is included in the denominator.

A failed playtest, scorer error, identity drift, or missing receipt is not
misreported as a zero task-quality score. Instead, the trial and matrix are
marked **incomplete**.

The `spark.admitted-task-quality-matrix.v1` aggregate includes:

- scored trials per objective;
- successes and denominator;
- mean raw task progress;
- mean provider turn duration;
- per-trial evaluated-token count in the individual scored receipts;
- source admission run ID;
- model name and exact digest;
- logs and exact individual receipts.

The aggregate carries:

```text
automaticRoutingPermitted: false
qualityRanking: NOT_ESTABLISHED
```

That is intentional. Twelve short trials do not establish a universal ranking,
and they certainly do not authorize a new BrainC routing policy.

## CI and evidence location

[The Rung 54 workflow](../.github/workflows/rung54-spark-task-quality-matrix.yml)
is triggered on PR changes and can also run manually.

It preserves artifacts:

```text
rung54-qwen2.5-0.5b-instruct
rung54-llama3.2-1b
rung54-spark-task-quality-matrix
```

The task orchestrator is:

```text
scripts/hosted_spark_task_matrix.py
```

Pure contract tests are:

```text
tests/test_hosted_spark_task_matrix.py
```

No local operator download or workstation setup is needed.

## Evidence limitations

This is a narrow semantic game-control benchmark. It does not measure
long-horizon planning, vision, full SPARK campaign completion, safety outside
the granted action grammar, or transferable general reasoning.

Future routing decisions should compare repeated task-specific evidence with
uncertainty bounds and negative controls, rather than treating one
five-turn success as model superiority.
