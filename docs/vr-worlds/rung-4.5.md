# SPARK VR · Rung 4.5 — Seven Worlds Awaken

Built from merged Rung 4 / PR #25, main
`56d41c326e891513631acdbae7d544a7b86c98d0`. This is a software-tested candidate
for review. Physical Quest 3 acceptance remains **not performed**.

## Working implementation

Ordinary campaign rooms inherit deterministic art from `worldId`, `roomId`,
native gates/obstacles and the existing quality preset. New reusable components
live in `spark-world-families.js` and `spark-enemy-art.js`; they use the existing
geometry helpers, renderer, simulation and XR presentation. There is no new
game engine, boss, game mode, runtime dependency or remote asset.

| Canonical world | Architectural vocabulary | Genuine software render |
| --- | --- | --- |
| First Stratum | Stone courses, gold arches, turquoise conduits and engraved slabs | [Quiet Array](after/world-stratum.png) |
| Tideglass Expanse | Layered blue-green fins, suspended crystals, wave inlays and flowing rails | [Salt Archive](after/world-tideglass.png) |
| Verdant Memory | Tapered roots, branching vaults, leaves and bioluminescent growth | [Rootwell](after/world-verdant.png) |
| Cinder Clockworks | Obsidian/brass relief, furnace grilles, overhead mechanisms, fissures and embers | [Fuel Chapel](after/world-cinder.png) |
| Prism Night | Split diamond panels, reflected-looking layers, violet angular symmetry | [Dream Library](after/world-prism.png) |
| Pale Orbit | Celestial rings, astronomical dials, constellation paths and deep-blue distance | [Lunar Relay](after/world-orbit.png) |
| The Uncreated | Incomplete frames, disjointed monuments and remnants of all six created worlds | [Unfinished Draft](after/world-uncreated.png) |

These are coherent procedural families, **not 126 individually handcrafted
rooms**. The polished Threshold, Glass and Machine architecture is reused.
All three opening stages plus the original Cantor/Warden static stages remain
byte-identical at all three quality presets, proven by 15 baseline mesh hashes.
Their specialized presentation and mechanics are preserved.

World geometry is generated once per room/gate/obstacle/quality key and cached
in the existing bounded cache. The room hash is stable and consumes no runtime
randomness or game RNG. The existing **30,000 static vertices** cap is unchanged.
New family decoration has a testable envelope: floor engravings at or below
3.1 cm, solid wall relief outside the body area, or overhead geometry at/above
2.65 m. Vertex and triangle bounds plus all native gate-axis checks protect
movement lanes. Canonical cover is still drawn from its original footprint;
no physics or navigation geometry is added.

## Creatures and atmosphere

Eight existing combat roles have individual proportions, color and geometry:
slender hooked collectors; armored archons with luminous cores; low articulated
hounds; floating segmented mirrors; siphon-like leeches; rooted spores; winged
moths; and ringed oracles. Regional aliases use the engine's actual
`COMBAT_ROLES` mapping. There are no invented enemy kinds or abilities.

Native `windup`, locked `chargeX/chargeY`, `charge`, `shield`, `rootTime` and
`flash` fields drive preparation, direction, charge pose, shields, stopped
stride and hit feedback. Cosmetic oscillation moves limbs only. Roles without
a native windup receive no invented countdown. Damage and collision remain
planar/canonical; visible appendages do not create anatomical hitboxes. Ordinary
death shards use the existing native burst's position and lifetime. Cantor and
Warden presentation is kept on its existing specialized path.

| Native enemy in active simulation | Rung 4 | Rung 4.5 |
| --- | --- | --- |
| Collector | [Before](before/enemy-collector.png) | [Harvesting figure](after/enemy-collector.png) |
| Archon | [Before](before/enemy-archon.png) | [Armored core](after/enemy-archon.png) |
| Hound | [Before](before/enemy-hound.png) | [Quadruped windup](after/enemy-hound.png) |
| Mirror | [Before](before/enemy-mirror.png) | [Segmented shield](after/enemy-mirror.png) |
| Leech | [Before](before/enemy-leech.png) | [Siphon silhouette](after/enemy-leech.png) |

Ambient particles are bounded to 2/6/10 in performance/balanced/high. Wall
currents, restrained mechanisms and world-specific fog/color add depth. Native
activity can gently brighten inlays. Reduced intensity removes incidental
motion without removing attack warnings, gates, damage or shield information.
There is no camera motion, full-screen postprocessing, transparency stack,
dynamic shadow map or real-time reflection/refraction. Crystal looks are
stylized layered opaque facets. Static detail and enemy ornament also scale
with quality. Dynamic CPU arrays still exist; the enemy transform loop avoids
creating an extra color array for every vertex.

## Optional Spellcraft introduction

The Living hub contains a collapsed **First Spellcraft lesson**. It explains
automatic Classic basics, directed trigger hold/point/release, the other-hand
native power, misses/cover, recovery and switching back. Its buttons use the
existing combat-profile preference control and pause/rearm behavior. Existing
aiming marks provide feedback in normal play. The guide does not introduce a
practice enemy, progression, reward or required tutorial step. Browser tests
open the actual guide, select both profiles and prove the campaign run does not
change. [Actual hub guide](after/spellcraft-lesson.png).

## Evidence and verification

The [ordinary Quiet Array before](before/world-stratum.png) /
[after](after/world-stratum.png) comparison uses the same room, seed, pose and
native simulation steps. The comparisons are not confined to the polished
Threshold. The five enemy captures also have identical native states, HP and
times in the old/new renderer. Both eye views and current controller hands are
checked in the [stereo wrist capture](after/world-stereo-wrist.png).

Screenshots are actual Chromium 153 / SwiftShader output from the staged game
at `/SparkTheSubstrate/`, with remote requests blocked. Controller/eye poses are
synthetic. The developer-only fixture directly selects a room and initializes
its normal encounter count; enemies subsequently spawn, move and prepare their
attacks through the unchanged native engine. This is **not a natural seven-world
playthrough**, proof of reaching locked worlds, or a physical Quest test.
Fixtures are served only by the local QA server, excluded from the Pages build,
and run in an isolated browser context. No fixture launcher ships in the game.

- Unchanged-main baseline: **479 tests passed** before implementation.
- Final `npm test`: **491 passed**, 0 failed (12 targeted additions).
- `node --test tests/vr-*.test.mjs`: **123 passed**, 0 failed.
- `node --test tests/pages-static.test.mjs`: **7 passed**; Pages staging passes.
- All five established browser suites pass: Ascension, Living, Awakening,
  Warden and Reality. The new Worlds browser suite also passes.
- Module parsing and `git diff --check` pass. No browser errors or remote
  requests in either world-comparison run. Tested exits leave zero live GL
  buffers/textures/programs and audio voices. Existing room-cache cleanup and
  all Rung 4 controller/wrist/recovery tests remain valid.

The new tests cover seven-way geometric dispatch, all 126 rooms × three
qualities, deterministic restore-equivalent meshes, cache invalidation,
triangle/interior and gate clearance, preserved showcases, native creature
roles/state, quality/reduced effects and unchanged source boundaries.
[Exact verification](verification.json) · [Before browser receipt](before/browser-results.json)
· [After browser receipt](after/browser-results.json) · [Performance comparison](performance-comparison.json).

## Performance and preserved systems

Before/after measurements use matching room fixtures, one renderer, two eyes,
active hands and six measured software submissions per preset after warmup.
They record static/submitted vertices, draw calls, dynamic uploads, new GL
objects and CPU submission duration. Ordinary-room geometry costs more than
Rung 4's sparse rooms; the comparison records that cost. The stage remains
cached, draw calls do not increase in these samples, and steady samples allocate
zero new GL objects. These short CPU timings are noisy and exclude GPU
completion. They are **not Quest FPS, sustained thermal evidence, hardware
approval or a general speed improvement claim**.

Balanced preset, matching active stereo fixtures (6 draw calls before/after;
dynamic upload includes the existing tracked gauntlets):

| World | Static vertices before → after | Dynamic upload KiB before → after |
| --- | ---: | ---: |
| Stratum | 4,248 → 11,916 | 127.4 → 139.8 |
| Tideglass | 4,248 → 7,356 | 120.1 → 148.5 |
| Verdant | 4,248 → 8,556 | 120.1 → 123.2 |
| Cinder | 4,560 → 9,600 | 120.1 → 127.4 |
| Prism | 4,248 → 5,796 | 120.1 → 135.6 |
| Orbit | 4,560 → 18,852 | 120.1 → 138.4 |
| Uncreated | 3,744 → 9,228 | 127.4 → 146.5 |

The JSON comparison includes all three presets' measured CPU medians/maxima.
Pale Orbit adds the most static detail; performance quality and reduced motion
are particularly relevant for its physical headset retest.

Sixty protected files are byte-identical to merged Rung 4: canonical engines,
attack intent, timing/progression/save modules, XR runtime/input, hand calibration,
gauntlets, wrist/panel controls, mode adapters/host, guardian presentation,
More Bounce logic, MIT license, dependencies and Pages builder/deployment file.
Hand/menu repairs are not rewritten. The separate online service is unchanged.
The small hub lesson only invokes existing profile preferences. No save schema
or namespace, earnings, transformations, boss rules, attack AI or speeds change.

## Remaining limits and Quest retest

Physical Quest 3 comfort, legibility, alignment, directed Spellcraft, sustained
GPU/thermal behavior and frame rate remain unverified. Layered geometry suggests
glass/reflection; it is not a full material or texture-art conversion. Existing
room footprints and planar combat remain the design boundary. All rooms inherit
families, with the five existing bespoke showcases deliberately preserved.

1. Use legitimately earned checkpoints to visit the seven worlds. Compare
   silhouettes, depth and native gate/cover clearance in both eyes.
2. Identify collectors, archons, hounds, mirrors and leeches during real play;
   read locked native warnings, hit/shield cues and actual death effects.
3. Compare all qualities and reduced intensity, especially crowded rooms and
   Pale Orbit. Record sustained heat/comfort and frame behavior.
4. Try the optional guide, left/right Spellcraft, native power, misses/cover and
   Classic switch-back. Recheck calibration, wrist, tracking recovery and exit.
5. Save/restore earned progress and verify Cantor/Warden and Eye choices. Keep
   original saves and separate online behavior independent.

[Extended Quest Field Lab](../QUEST3_FIELD_LAB.md#rung-45--seven-worlds-and-creature-identity).
Human review and headset acceptance remain pending. No automatic merge or
deployment is performed.
