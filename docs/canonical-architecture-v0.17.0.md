# SPARK v0.17.0 Canonical Architecture Baseline

This document freezes the architecture that exists in the first canonical
`SparkTheSubstrate` repository import. It is an inventory, not a redesign.

Canonical baseline commit:

```text
eae83b56aa9f1e80a2e16e0e183c509c24bd8b35
```

Application version:

```text
0.17.0
```

The purpose of this baseline is to give future PixelForge, PhiCade and Unreal
integration work a precise source boundary without rewriting or flattening the
current game.

## Runtime shape

SPARK is already a multi-runtime game family inside one source tree.

```text
SPARK: The Substrate
|
+-- Descent
|   +-- campaign
|   +-- online two-player co-op
|   +-- guardian rematches
|   +-- Daily Descent
|   +-- Endless Dungeon
|
+-- Duel
|
+-- Sideways Descent
|   +-- brawler/platform runtime
|   +-- merchants / physical coins / imprints
|   +-- vessel paths / relic branches
|   +-- guardian memories
|   +-- physical Memory Arcade
|
+-- Echo Lives
|
+-- shared keepsakes
    +-- Vault
    +-- Spark Cards
    +-- The Table
    +-- Substrate coin bank
```

The current project is not a thin page around one engine. Different modes have
their own state machines and save boundaries, while sharing selected world,
vessel, reward, art and lore data.

## Primary source boundaries

### Descent

Primary orchestration:

```text
public/descent.js
```

Core deterministic game state and simulation:

```text
public/action-engine.js
```

Important supporting modules include:

```text
public/worlds.js
public/world-expansion.js
public/world-story.js
public/story.js
public/equipment.js
public/mastery.js
public/dungeon.js
public/boss-rematch.js
public/combat-view.js
public/online.js
public/progress.js
```

`public/action-engine.js` owns the core action-RPG state vocabulary, including
rooms, player state, enemies, vessel powers, movement, combat, gifts, gates,
keys, seals, world travel, equipment, daily state, endless state and
observations.

Its public observation seam is already useful for an external runtime adapter:

```text
observeRun(run, meta)
```

The current browser orchestration also exposes bounded runtime control through
`window.SparkDescent`.

### Sideways Descent

Primary deterministic side-view engine:

```text
public/sideways-engine.js
```

Presentation and feature modules:

```text
public/sideways-view.js
public/sideways-brawler.js
public/sideways-build.js
public/sideways-scenery.js
public/sideways-paths.js
public/sideways-path-art.js
public/sideways-guardians.js
public/sideways-memories.js
```

The side engine already has a clean state-oriented API:

```text
createSideJourney()
enterSideRoom()
sideInteract()
morphSide()
sidePower()
stepSide()
observeSide()
sideSave()
restoreSide()
loadSide()
saveSide()
```

At v0.17.0, Sideways contains 39 rooms across the seven existing worlds, vessel
paths, five relics, six matching equipment sets, physical coins, merchants,
lasting memory imprints, physical props, grabs/throws, one shallow depth-lane
prototype, guardian memories and the Memory Arcade.

The persistent Sideways key remains:

```text
spark-substrate-sideways-v1
```

The payload is schema 2 with explicit schema-1 migration.

### Duel

Core duel simulation:

```text
public/duel-engine.js
```

Presentation:

```text
public/duel-view.js
```

Duel remains its own runtime with independent frame/combat rules rather than
being forced through Descent or Sideways movement semantics.

### Endless Dungeon

Dungeon-specific state and progression:

```text
public/dungeon.js
```

It is hosted by the Descent shell but keeps its own saved run/record boundary.

### Echo Lives

Current standalone entry:

```text
public/echo-lives.html
```

Echo Lives remains the preserved reincarnation simulation and retains its own
device-local state.

## World and room truth

Top-down campaign room/world truth is rooted in:

```text
public/action-engine.js
public/worlds.js
public/world-expansion.js
```

The current campaign remains the 126-chamber seven-world structure described by
the v0.17.0 verification harness.

Sideways has its own authored side-view topology in:

```text
public/sideways-engine.js
public/sideways-paths.js
```

This separation is intentional. A future canonical project layer may link the
two representations by stable semantic IDs, but should not erase their different
geometry or control models.

## Shared keepsake boundary

Cross-mode optional rewards live in:

```text
public/substrate-rewards.js
```

Current keepsake storage key:

```text
spark-substrate-keepsakes-v12
```

This layer owns Substrate coins, Vault alcoves, Spark Cards, fighter meetings,
reward receipts and Sideways deposit serials.

It is distinct from campaign keys, seals, mastery, Sideways carried coins and
legacy Arcade saves.

## Memory Arcade is already a real runtime system

The v0.17.0 source contains the complete physical Memory Arcade implementation,
not only a design document or card framework.

Primary files:

```text
public/memory-arcade.js
public/memory-arcade-state.js
public/memory-arcade-manifest.js
public/memory-arcade.css
public/legacy-runtime.js
public/legacy/
```

The current authentic cabinet collection is:

```text
Echo Lives        v0.1.0
First Descent     v0.2.0
First Duel        v0.12.1
First Sideways    v0.13.0
First Endless     v0.9.0
First Forge       v0.4.0
First Mastery     v0.7.0
```

Each entry in `memory-arcade-manifest.js` records its historical commit and
authenticity. The archive also contains the fictional sealed hook
`The Unwritten`, which has no launch target.

Legacy payloads live under:

```text
public/legacy/echo-lives/
public/legacy/first-descent/
public/legacy/first-duel/
public/legacy/first-sideways/
public/legacy/first-endless/
public/legacy/first-forge/
public/legacy/first-mastery/
```

The legacy shell intentionally replaces browser storage with isolated cabinet
storage and does not grant old builds access to current campaign state.

Legacy save namespaces follow:

```text
spark-substrate-legacy-<cabinet>-v1
```

The collection itself uses:

```text
spark-substrate-memory-arcade-v1
```

This system should be preserved as a first-class consumer of any future
PixelForge/PhiCade cartridge infrastructure rather than replaced by a generic
Extras menu.

## Save and authority boundaries

Current important boundaries include:

```text
Descent campaign       personal version-2 save + anonymous server backup
Sideways               spark-substrate-sideways-v1
Keepsakes              spark-substrate-keepsakes-v12
Memory Arcade          spark-substrate-memory-arcade-v1
Legacy cabinet state   spark-substrate-legacy-<cabinet>-v1
Echo Lives             independent device-local save
Endless                separate dungeon run/record
Guardian rematches     no campaign reward mutation
```

Future bridges must preserve these boundaries. Transport registration must not
become permission to rewrite unrelated saves.

## Online runtime

Online Descent rooms are server-authoritative at the host simulation layer and
use the D1-backed room service:

```text
server/rooms.mjs
```

Anonymous campaign backup uses:

```text
server/progress.mjs
```

Database schema:

```text
db/schema.ts
drizzle/
```

The hosting project binds D1 as:

```text
DB
```

in:

```text
.openai/hosting.json
```

The room service validates the authoritative run shape using the same
`validRun()` contract as the game engine.

## Verification surface

The canonical import already contains a substantial regression suite under:

```text
tests/
scripts/check-*.mjs
```

Coverage includes campaign, co-op transport and recovery, Sideways, Sideways
economy, vessel paths, guardian memories, Duel, Endless, Memory Arcade, legacy
objectives, worker/D1 behavior, save compatibility and world expansion.

Any runtime bridge work must add tests without weakening these existing
boundaries.

## PixelForge integration boundary

SPARK should remain the game. PixelForge should remain the forge.

The first PixelForge integration should consume existing SPARK state and APIs,
not port or rewrite them.

Recommended first bridge target:

```text
SPARK Descent
The Threshold
Spark vessel
one movement action
one dash or pulse action
observeRun() before / after
no save mutation outside the existing game contract
```

A SPARK Runtime Bridge adapter should translate a deliberately narrow external
intent into the existing engine call path and return existing SPARK observations
and semantic events.

The transport should reuse the already-qualified PixelForge Runtime Bridge v1
JSONL seam. SPARK should not invent another process protocol.

## PhiCade integration boundary

PhiCade should govern controller identity, action authority, capability claims
and evidence.

It should not own SPARK game rules.

The intended chain is:

```text
PhiCade controller
        |
        v
PhiCade AuthorityPolicy
        |
        v
PixelForge Runtime Bridge v1
        |
        v
SPARK adapter
        |
        v
existing SPARK engine
        |
        v
SPARK observation / semantic event / hash
```

The first qualification should prove one real SPARK state transition through the
existing engine. It should not claim framebuffer streaming, exact replay,
restorable snapshots or full-game agent support until those are separately
qualified.

## Unreal boundary

Unreal is a future high-fidelity incarnation, not a replacement for the current
browser game.

PixelForge already has an Unreal asset/discovery/export pipeline. The future
SPARK-to-Unreal path should consume canonical semantic IDs and project data while
leaving the current Web/Canvas implementation playable and historically
preserved.

The browser build is itself a valid SPARK incarnation.

## Immediate next rung

After this baseline is merged:

1. add a narrow SPARK Runtime Bridge adapter around the existing Threshold
   simulation;
2. expose `describe / registerController / observe / submit / advance / events /
   snapshot / recording / authority / hash` through the PixelForge Runtime
   Bridge v1 contract;
3. prove local movement through the real SPARK engine;
4. add no new game rules;
5. preserve all current save namespaces;
6. then pin that exact SPARK revision from PhiCade and qualify the same state
   transition through PhiCade authority.

That creates the first real chain:

```text
PhiCade -> PixelForge -> SPARK
```

without collapsing the responsibilities of any of the three projects.
