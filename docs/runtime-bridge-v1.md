# SPARK Runtime Bridge v1 — Threshold Qualification

This rung exposes one deliberately narrow SPARK incarnation for external runtime
qualification without rewriting the game or creating a second simulation.

The adapter lives at:

```text
runtime/spark-threshold-adapter-v1.js
```

It wraps the existing Descent engine:

```text
public/action-engine.js
```

and starts a fresh in-memory Spark run in:

```text
The Threshold
```

using a fixed seed.

## Purpose

The first bridge proof is intentionally small:

```text
external governed host
        |
        v
PixelForge Runtime Bridge v1
        |
        v
SPARK Threshold adapter
        |
        v
existing createMeta / createRun / stepRun / observeRun
```

No new movement, dash, power, collision, room, save, reward or progression rules
are implemented by the adapter.

## Descriptor

The adapter describes itself as:

```text
protocol:       pixelforge-runtime-bridge
version:        1
gameId:         spark-the-substrate
runtimeVersion: spark-threshold/0.17.0-bridge-v1
clockMode:      external
deterministic:  true
replayExact:    false
```

The fixed-seed, externally stepped qualification is deterministic, but this rung
does not claim exact Replay v1 support.

## Controller scope

Threshold v1 allows one registered controller.

The only exposed actions are:

```text
MOVE
DASH
PULSE
```

They map to the existing Descent input path:

```text
MOVE  -> stepRun(run, { x, y }, 1/60)
DASH  -> stepRun(run, { x, y, dash: true }, 1/60)
PULSE -> stepRun(run, { power: true }, 1/60)
```

The adapter does not implement its own physics or vessel-power rules.

Movement vectors must be finite, bounded to [-1, 1] on each axis, and have
magnitude at most 1.

## Semantic events

Accepted actions produce bridge-facing events:

```text
SPARK_PLAYER_MOVED
SPARK_DASH_STARTED
SPARK_PULSE_USED
```

Rejected actions produce:

```text
SPARK_ACTION_REJECTED
```

with bounded reasons such as:

```text
WRONG_TICK
MALFORMED_ACTION
UNSUPPORTED_ACTION
DASH_COOLDOWN
POWER_COOLDOWN
MULTIPLE_ACTIONS_SAME_TICK
UNREGISTERED_CONTROLLER
```

These events describe outcomes from the real action engine. They are not a new
gameplay authority layer.

## Save boundary

The adapter creates a fresh in-memory qualification state.

It does not read or write:

```text
localStorage
sessionStorage
server/progress.mjs
server/rooms.mjs
D1
spark-substrate-sideways-v1
spark-substrate-keepsakes-v12
spark-substrate-memory-arcade-v1
spark-substrate-legacy-<cabinet>-v1
```

It cannot overwrite a player's campaign, Sideways, keepsake or Memory Arcade
state.

## Snapshot and recording semantics

`snapshot()` returns the current bounded qualification observation.

It is not advertised as a restorable emulator-style save state.

`recording()` captures submitted roots and resulting observations for this
qualification scope.

`hash()` returns a SHA-256 digest over the qualification state and event stream.

None of those methods silently promote this rung to exact replay support.

## Local proof

Run:

```bash
npm run test:runtime-bridge
```

or:

```bash
node scripts/check-runtime-bridge.mjs
```

The proof requires:

1. a real v0.17.0 Spark run starts in The Threshold;
2. the player starts at the existing engine spawn;
3. MOVE changes the existing engine player position;
4. DASH increments the existing Descent dash statistic and starts cooldown;
5. PULSE increments the existing vessel-power statistic and starts cooldown;
6. malformed and wrong-tick actions fail closed;
7. bridge observation, events, snapshot, recording, authority and hash remain
   available.

## What this proves

This rung proves that SPARK can present a narrow, deterministic adapter compatible
with the PixelForge Runtime Bridge v1 method surface while preserving the real
Descent engine as the gameplay authority.

## What this does not prove

This rung does not yet prove:

- PixelForge JSONL transport is attached to SPARK;
- PhiCade has qualified SPARK;
- browser framebuffer or audio streaming;
- campaign save mutation through the bridge;
- co-op;
- Sideways;
- Duel;
- Endless;
- Memory Arcade cabinet launching through PhiCade;
- exact replay;
- Unreal execution.

Those are separate capability-specific rungs.

## Next rung

PixelForge should load this exact SPARK adapter from a pinned SPARK revision,
wrap it with `createBridgeV1()`, serve it through the already-qualified JSONL
transport, and prove the same Threshold movement transition cross-repository.

After that, PhiCade can pin both source revisions and place its existing
`AuthorityPolicy` in front of the same SPARK action.
