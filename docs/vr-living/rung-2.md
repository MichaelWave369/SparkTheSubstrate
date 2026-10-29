# SPARK VR: The Living Substrate — Rung 2

Implemented candidate, based on merged Rung 1 at `025e98c` on current main at intake.
Authority: the user's **Rung 2: Unified Immersive Worlds, Six-Vessel Magic, and
Physical Adventure** build mission, 2026-10-29. P0 campaign continuity and P1 vessel/
showcase work are complete in software; bounded P2 wrist/hub/feedback is included.
Physical Quest 3 acceptance and human review/merge remain required.

Open `public/vr/living.html` for the shared hub. The established `vr/index.html`
Descent path and `vr/ascension.html` arena remain available. This branch does not
replace or migrate the established session host; it adds the tested shared path.

## Gameplay authority and architecture

`spark-living-app.js` → `LivingSparkHost` → shared `SparkXRRuntime` → mode adapter
→ original canonical engine. Rendering, wrist, targeting and feedback observe that
state. **No new damage, reward, gate, save or progression engine.**

| Component | Responsibility |
|---|---|
| `spark-xr-input.js` / runtime v1 | Current rigid head/grip/ray validation; bounded motion; trigger release; queued edges consumed once; neutral rearm; one bounded 60 Hz clock; XR lifecycle |
| `DescentXRAdapter` | Native `stepVRPreview`, `chooseVRPhase`, `morphRun`, `enterGate`; all room/phase snapshots; native movement/collision and powers |
| `LivingSparkHost` | Explicit old-format checkpoint save/restore, genuine choice/menu actions, owned mode state, clean session exit and relaunch |
| `VesselPresentation` v1 | Six styles, native effect/shot observations, transformation feedback, charge/recovery appearance, optional vessel tones/haptics |
| `room-theme.v1` / geometry | Seven world palettes, three showcase treatments, quality presets, cached static batches and bounded dynamic geometry |
| `xr.target.v1` | Current hand ray, bounded 1.6 m reach and canonical-cover occlusion for presentation targets; activation still uses native eligibility |
| Shared renderer | Cached stage GPU buffer, dynamic actors/effects, tracked hands, deliberate wrist, correct per-eye framebuffer handling |

Original `action-engine.js`, `duel-engine.js`, `duel-spatial.js`, Sideways, Echo Lives,
Memory Arcade, equipment/progression and multiplayer/online services are unchanged.
Rung 1 contracts keep v1 with additive optional fields; new host, vessel, room and
targeting contracts are separately versioned. Future modes can implement the same
adapter contract. Only Descent and Ascension are offered as playable.

### Mechanics and honest presentation

- Descent **auto-attacks remain automatic**, with original range, target selection,
  homing/volley/cleave behavior, stats and cooldowns. Hand rays are aiming/interaction
  guides. Holding/releasing either trigger requests native vessel power; charge adds
  no damage. The wrist states this distinction. Failed recovery requests show the
  real remaining cooldown. Native bolts retain their original cover behavior.
- Human spectral blade/arc, Computer cyan prisms, Animal claws, Tree branches/leaves,
  Rock crystalline gauntlets and Spark gold rings/seeds are visually distinct.
  World hit/power effects come from actual engine effects/shots. No raw swing creates
  a hit. Transformation calls canonical resonance checks and the three-second
  recovery, preserving health fraction and earned abilities.
- Horizontal tracked motion becomes bounded ordinary movement input, blended with
  stick input inside the selected native speed cap and canonical cover collision.
  Dash is the original dash, including its original recovery/iframes. Descent duck
  lowers the view; **it supplies no added immunity in the 2D combat engine**.
- Nearby gates and pending keys/relics can be pointed at. Distant or occluded targets
  cannot become remote actions. Grip/A/E and eligible wrist gate rows call canonical
  gate APIs; locked gates stay locked. Collectibles retain native contact pickup;
  this release does not invent remote grabbing or new environmental powers.
- New solid decorations stay beyond the legal body footprint or overhead. Existing
  cover uses exact canonical footprints. Threshold has a floating sanctuary crown,
  Glass has crystal ribs/overhead passage structures, Machine has copper conduits
  and a slow mechanical rotor. All 126 rooms still derive from canonical data.
- `performance`, `balanced`, `high` vary static detail, particles and framebuffer
  scale. Static stage batches are cached (four-room cap); hidden wrist textures
  are not repainted. Quality geometry changes immediately; XR framebuffer scale
  applies on session entry. No headset FPS or compatibility guarantee is inferred.

## Wrist, persistence and hub

Left X or right-stick click opens the paused wrist; desktop Tab/Esc provides the
same capture. It shows the actual vessel, HP/recovery, room/world, objective, keys,
seals and relics. Left stick selects, trigger confirms. Progression choices appear
automatically. Save/restore, earned transformations, legal gate navigation, comfort,
quality, recenter and exit are controller-operable. Held gameplay controls must
return to neutral before resuming; a menu trigger cannot cast on release.

The wrist is anchored near the tracked left hand and kept facing the viewer for
readability. On missing hand tracking the pause interface uses a head-facing fallback.
`worldModePacket()` provides an original versioned state/action description for a
future GenEWrist WORLD MODE consumer; no external integration is claimed or required.

Checkpoint IO uses the existing `spark-substrate-immersive-vr-v1` schema unchanged.
Restore is explicit and canonically validated. The host saves actual progressing
Descent state every 15 game seconds/on room change and on hub exit; save errors are
reported. Original campaign, Sideways, Arcade, Duel records and online credentials
are not read or written. The original three comfort preferences retain their format;
other new UI preferences last for the visit. Arena state remains ephemeral and does
not advance Duel records or campaign rewards.

Switching modes deliberately exits the session, disposes render/audio state, then
selects the destination. The player explicitly enters it again. It is **not** a
seamless in-session transition. Each adapter keeps its own in-memory gameplay state.
Tracking/visibility/source/reset interruption, reference-space fallback, neutral
rearm and async cancellation safeguards remain mandatory.

## Implemented and verified checklist

| Mission | Result / evidence |
|---|---|
| P0 real Descent through shared runtime | Fresh Threshold → Glass → 14 kills → native rewards/choices → Machine → save/restore/continue, in Node and actual browser host |
| All rooms / legal gates / progression | Every room exit compared with original engine, including actual eligible crossings; original complete progression/endings/rebirth/save suites pass |
| P1 six vessels | Six unique mappings/meshes; native damage/cooldown equality for every vessel; browser earns resonance before switching through every form |
| P1 showcase worlds / quality | Three real canonical room screenshots; all seven themes and three bounded quality presets tested; no replacement demo rooms |
| Physical interaction / authority | Native movement speed/cover, no duck immunity, reach/occlusion, locked transformations, power recovery and input rearm tests |
| P2 wrist/hub/feedback | Deliberate current-state wrist, real choices and saves, two playable modes, clean exit/relaunch; original synth/haptics optional |
| Runtime / stereo / cleanup | Existing interruption/race/session tests; browser retained geometry in both eyes, zero WebGL errors; instrumented buffer/texture/program balances and active tones all zero after mode exit |
| Static/offline / preservation | Project-subpath browser loading, no remote requests, Pages staging/integrity and all original mode regressions |
| Quest Field Lab | Eight additional manual checks; all default to not tested and are never auto-passed |

See [verification receipt](verification.json), [browser receipt](browser-results.json)
and [candidate file hashes](artifact-manifest.json). Tests include controlled save/
gate fixtures, clearly labeled in source; the browser gameplay/transformation path
does **not** inject health, enemies, rewards, abilities, room progress or unlocks.

Browser route continues Machine → Roots → Machine → Quiet → Conduit → Reliquary,
collects Ivory by native contact, then returns through Conduit/Cistern to clear the
Mirror Nursery. Only then does it transform. Later form screenshots wait through
each native morph cooldown. These screenshots show software WebGL with synthetic
poses, not headset observations:

| Actual scene | Screenshot |
|---|---|
| Threshold | [threshold.png](threshold.png) |
| Glass Causeway | [glass.png](glass.png) |
| Machine Sepulcher | [machine.png](machine.png) |
| Earned Tree transformation | [tree-transformation.png](tree-transformation.png) |
| Human / Computer | [human](vessel-human.png) · [computer](vessel-computer.png) |
| Animal / Rock / Spark | [animal](vessel-animal.png) · [rock](vessel-rock.png) · [spark](vessel-spark.png) |
| Deliberate wrist | [wrist.png](wrist.png) |

## Reproduce

```sh
npm test
node scripts/check-runtime-bridge.mjs
node scripts/build-pages.mjs
node --test tests/pages-static.test.mjs
```

Browser CI reuses isolated Playwright 1.62.1 tooling from Rung 1. No app dependency
installation is needed for engine tests or gameplay. With Playwright and Chromium
installed as described in the Rung 1 guide:

```sh
SPARK_PLAYWRIGHT_MODULE=/tmp/spark-xr-qa/node_modules/playwright/index.mjs node scripts/check-vr-ascension-browser.mjs
SPARK_PLAYWRIGHT_MODULE=/tmp/spark-xr-qa/node_modules/playwright/index.mjs node scripts/check-vr-living-browser.mjs
```

The second script serves the actual app beneath a project subpath, uses synthetic
controller/head input through the actual runtime, captures live WebGL scenes and
records cleanup. Its replay policy resides in `tests/`, outside deployed runtime
assets. Both scripts block and count unexpected requests; CI uploads their evidence.

## Quest 3 manual acceptance and limits

Use a trusted HTTPS preview of **this branch** at `vr/living.html`. The live Pages
site receives it only after human merge. Desktop can use `python -m http.server
8765 --directory public` and `http://localhost:8765/vr/living.html`.

1. Start seated at 50% movement and 30° snap. Check scale, both eyes, both tracked
   hand rotations/positions, and repeat enter/exit. No jumping or forceful throws.
2. Complete Threshold → Glass through the real gate. Check enemies, telegraphs,
   auto-attacks and trigger-release vessel power; misses still recover normally.
3. Clear Glass, collect real fragments, make the karma/gift choices in the wrist,
   open the eligible Machine gate, save, restore and continue. Compare original saves.
4. Inspect all three showcase rooms: overhead clearance, cover silhouettes, projectiles,
   gates and current-hand targeting. Check physical lean against native boundaries;
   use stick/dash alternatives. Ducking is a view change in Descent, not immunity.
5. After legitimately earning Nursery resonance, identify all six forms by their
   hands; verify native transformation cooldown and preserved health fraction.
6. Open/close the wrist deliberately. Read objective/inventory, select choices and
   use save, restore, gate navigation and comfort entirely with controllers. Ensure
   held triggers/grips/sticks cannot spill into gameplay on resume.
7. Test each missing controller pose, head tracking loss, visibility interruption,
   browser blur and reference reset. Confirm pause, neutral rearm, recenter and
   absence of queued action bursts. Check optional audio/haptics and reduced intensity.
8. Change quality/posture/speed/snap/vignette, then exit/reenter. Check subjective
   comfort and actual headset performance. Browser callback timings are not headset FPS.
9. Switch to Ascension via the wrist/hub; confirm clean exit, explicit relaunch,
   independent encounter state, and reliable return to the Descent checkpoint.
10. Record actual Field Lab results manually. Stereo counts, synthetic poses and
    software GPU object balances cannot certify hardware comfort or tracking.

Physical Quest tracking, frame rate, controller feel, sound localization, haptics,
wrist typography and comfort are unverified. Models remain original stylized
procedural geometry. There is no optical hand tracking, anatomical collision,
room-scale traversal, hand-redirected Descent auto-attacks, remote grabbing,
seamless mode transition or playable Sideways XR adapter. Native world-space impact
effects are present; attacker-specific injury direction is not invented when the
engine does not provide it. No production deploy or independent verification claim.

Rung 3 recommendation: first run the Quest Field Lab and repair observed comfort/
performance issues; then qualify explicit directed native combat inputs and the
first Sideways adapter. Keep the current automatic combat contract until that
extension is tested. Rollback is a normal revert: no save schema migration exists.
Final release authority remains human-owned; do not merge automatically.
