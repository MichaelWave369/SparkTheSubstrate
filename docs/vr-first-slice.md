# SPARK immersive VR first slice (proposed v0.17.x experimental)

**Intent:** make the first playable headset-native incarnation of Spark in the
existing repository. This is a **separate, disposable two-room Descent run**, not
a replacement for its 126-chamber campaign, 39-room Sideways mode, Duel,
Memory Arcade, multiplayer, rewards, or any saved-progress namespace.

## Entry / preview

1. Open Spark's home page and select **Immersive VR · prototype**.
2. On a desktop with WebGL, click **Desktop 3D preview** to inspect the stage.
   WASD/arrows move, drag to turn the view, Space dashes, F invokes canonical
   vessel power, E interacts with canonical gates, Esc pauses.
3. On a Quest 3 in an HTTPS-capable WebXR browser, click **Enter immersive VR**
   and accept the immersive-session prompt. No session starts automatically.
4. Face the north gate and use left stick to walk to it. Right grip/A interacts
   once the actual engine's gate-proximity rule passes.
5. In the **Glass Causeway**, actual Spark enemy spawning, damage, autoweapon
   attacks, dash and power follow `action-engine.js`. Room visual appearance is
   an original low-poly interpretation, not a full translation of Spark 2D art.
6. The first VR slice stops at Threshold and Glass. Rewards and progression
   are **not saved or promoted** back to any campaign.

## Controllers / comfort

- Left stick: head-relative movement and strafing through the actual Spark engine.
- Right stick horizontal: 30-degree snap turning with neutral reset latch.
- Left trigger: Spark dash; right trigger: vessel power; automatic weapon attack
  remains the real engine default; right grip or A: gate interaction.
- Right stick click: pause/resume.
- Loss of headset visibility, tracking or a controller pauses and drops held
  controls. User-triggered session exit returns to the preview page.
- Local-floor reference space preferred; local fallback is explicitly calibrated
  to a 1.6 m reference eye height. This is approximate, not guardian/collision
  guardian calibration. Do not assume wall-lean/room-scale boundary physics.
- Seated first testing recommended, clear physical surroundings, stop for
  discomfort. No teleport, vignette option, spatialized audio, collision-aware
  room-scale walking, or 72/90 FPS claim yet.

## Architectural truth boundary

- `public/vr/spark-vr-model.js` imports real `createMeta/createRun/stepRun/
  observeRun/ROOMS/obstacles/gateStatus` from `public/action-engine.js`.
- `public/vr/spark-vr-renderer.js` renders bounded stereoscopic WebGL
  geometry derived from the canonical room/obstacle/enemy/shot positions.
- `public/vr/spark-vr-app.js` owns only browser/XR input, fixed-step scheduling,
  explicit session lifetime, view transforms, and the temporary preview state.
- No new engine fork, no console `eval`, no runtime dependencies, no API calls,
  no persisted VR run, no automatic promotion of kills, coins, keys or abilities.
- Browser `navigator.xr` availability and stereo acceptance depend on an
  actual HTTPS deployment and Quest hardware. Automated tests validate math,
  real engine stepping, first gate travel, combat spawn, collision budgets and
  preservation of the existing entry route, **not** physical headset rendering.

## Release gate: must physically test, do not infer from CI

| Acceptance | Expected result | Current status |
| --- | --- | --- |
| Desktop route | link opens an intact 3D preview, no JS console errors | Pending |
| Stereo | Quest browser enters two-eye XR, correct depth and scale | Pending |
| Controllers | left stick move, right snap-turn, trigger dash/power, grip gate | Pending |
| Tracking | head tracking independent of body movement | Pending |
| Gates | north Threshold → Glass uses actual proximity and availability | CI contract only |
| Combat | real Glass enemy spawn, attacks and HP deductions | CI contract only |
| Isolation | existing personal campaign, Sideways and Arcade saves stay untouched | CI source checks; manual confirm pending |
| Safety | lost tracking/controller pauses; exit and re-enter safely | Pending |
| Comfort | seated first trial, no eye strain or unsafe passthrough assumptions | Pending |
| Performance | actual headset FPS / thermal comfort for 15 minutes | Pending |
| Offline | verified over HTTPS after asset caching, no cloud service dependence | Pending |
| Production | seven worlds, full campaign, six vessel modes and co-op | Not implemented |

## Next meaningful rung

After real Quest validation, build an **XR-first interaction vocabulary** for
shards, melee, projectiles, collision-aware locomotion, gates and six vessels.
Only then graduate from the first two rooms to the remaining six worlds using
existing Spark semantic IDs and game rules. Treat BTM's VR structure as a tested
reference, never as a substitute for Spark's authoritative game engine.

Source and art remain under Spark's existing project terms; this PR adds no
third-party assets and changes no preserved historical versions.
