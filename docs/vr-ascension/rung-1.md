# SPARK VR: ELEMENTAL ASCENSION — Rung 1

Candidate implemented and executed in local software tests. Physical Quest 3
verification has **not** been performed. No deployment, release or independent
verification is claimed. Human review and merge remain required.

Entry: `public/vr/ascension.html`. Existing seven-world Descent remains at
`public/vr/index.html`, now with a relative link to the arena. The normal Spark
start page, keyboard controls, save keys, licensing and hosted services are preserved.

## Controlling scope and implementation decisions

[Controlling brief](controlling-brief.md), derived from the user's 2026-10-29 request.
Baseline is `a26b94efd5aa7787e390bc50254bce97588608f1` (PR #20).
All ten requirements are in scope; headset acceptance is a manual gate, not an
implementation claim. Rung 1 chooses one coherent Spark-versus-Archon encounter.
There are no extra modes, unlocks, progression rewards or persistent arena saves.

Read before implementation:

- Existing `public/vr/` app, model, comfort, save, diagnostics, math and renderer;
  all four existing VR test files and Pages workflows/build script.
- `public/action-engine.js`: authoritative Descent movement, collision, powers,
  shots, damage, gates and progression. It is unchanged.
- `public/duel-engine.js`: authoritative techniques, input buffering, startup,
  cooldown, bolt creation, damage/guard/meter, KO and best-of-three rounds.
- BTM `b6fe9cf3e1d85cf082991e5516e0c8c4d73ad2b9`: `src/immersive-rig.js`,
  `immersive-play.js`, `vr-input.js`, `vr.js` and related renderer patterns.
  Design lessons used: one simulation clock, current grip/ray poses, bounded motion,
  UI capture until neutral, pause on interruption, session ownership checks, disposal
  and optional feedback. No BTM engine or art is embedded or forked.

## Architecture and authority

| Layer | Files | Responsibility |
|---|---|---|
| Input v1 | `spark-xr-input.js` | Validate rigid matrices; read current left/right grip/ray poses; bounded head/hand motion; gesture/trigger edges; neutral rearm; snap/UI controls |
| Runtime v1 | `spark-xr-runtime.js` | One 60 Hz simulation clock; queue render-frame edges once; WebXR/desktop lifecycle; pause menu; reference reset; cleanup; adapter calls |
| Mode contract v1 | `spark-xr-adapters.js` | `version`, `id`, `step`, `snapshot`, `drainEvents`, `dispose`; optional `restart`; no generic save policy |
| Duel adapter | `DuelXRAdapter` | Translate validated intent to canonical `stepDuel`; authored opponent inputs; snapshot and presentation events only |
| Descent adapter | `DescentXRAdapter` | Execute the existing `stepVRPreview`/`vrRoomSnapshot` over canonical Descent; exercised in tests; host owns choices/saves |
| Canonical spatial Duel v1 | `duel-spatial.js`, opt-in hooks in `duel-engine.js` | Sanitize combat geometry, lock aim, create and sweep canonical bolts, canonical dodge timers; reuse existing `addDamage`, recovery and match rules |
| Shared presentation | `spark-vr-renderer.js`, `spark-xr-feedback.js` | Existing Descent geometry plus arena, tracked controller gauntlets, windups, bolts, impacts, synth audio and optional pulses |
| Desktop bridge | `spark-xr-preview.js`, `spark-ascension-app.js` | Clearly synthetic poses from mouse/keyboard; same input/runtime/adapter/renderer as XR |

All paths here are under `public/vr/` except canonical Duel files in `public/`.
The new runtime accepts an adapter only with `spark.xr.adapter.v1`. Intent uses
`spark.xr.input.v1`; canonical spatial payloads independently require version 1.
No component under XR can submit damage, HP, meter, cooldown or match outcomes.

The original Descent app remains in place with its complete choices/checkpoints.
Rung 1 does not migrate that app to the new session lifecycle. Its adapter proves
the contract against the real engine. Sideways can supply its own `step`/`snapshot`
adapter using the same pose/input, lifecycle and renderer hooks; a playable Sideways
XR adapter is deferred. No second Descent, Duel or Sideways engine is introduced.

### Explicit opt-in canonical geometry

Only `createDuel({spatial:true})` enables the new geometry. Default 2D Duel ignores
spatial payloads entirely (deterministic equality test). Action engine, progression,
original desktop bindings and all existing save readers/writers are unchanged.

- Player uses the existing Spark **Lumen Thread** technique: base damage 14,
  canonical special startup/recovery and 300-frame/five-second cooldown. Canonical
  guard, chip, hitstop, combo scaling and meter still apply. There is no extra mana
  cost for this existing move. Holding charge affects visual size only.
- Either hand can release a cast. Simultaneous release selects the right hand once;
  both hands share that same canonical move/cooldown. A valid miss spends recovery.
  Invalid/stale/out-of-bounds aim is canceled; it never becomes a head-directed shot.
- Gesture mode uses bounded forward hand velocity on release; otherwise the current
  pointing ray is used. Trigger mode always uses that ray, without motion requirements.
- Opt-in Archon startup is 42 frames/0.7 seconds to make its warning readable. Its
  aim locks at startup and its canonical bolt moves at 10 units/tick (about 6 m/s).
  This is an explicit arena presentation accommodation, not a change to normal Duel.
- New canonical spatial dodge shifts the target 45 units for roughly 0.3 seconds,
  recovering in roughly 1.5 seconds. It supplies **no invulnerability**. A projectile
  aimed at that displaced location still hits. Cast and dodge cannot override stun
  or attack recovery. Backward movement retains Duel's existing directional guard.
- Only the opt-in spatial bolt collision changes to a swept 20-unit-radius target
  anchored to the validated HMD pose. This is a small training target, not anatomical
  full-body physics. Normal Duel keeps its original 2D collision rules.

No new app dependencies, asset downloads, CDN scripts or network service calls.
Playwright is optional isolated test tooling, installed only in the browser CI job.
Original geometry/synthesis is recorded in [asset attribution](../../ASSETS_AND_ATTRIBUTION.md).

### Tracking and collision boundaries

Input requires current finite rigid transforms for head and both controller grips;
emulated positions, reflected/scaled matrices, missing or implausible transforms
cancel charge and pause. A current valid grip may supply direction if its ray is
missing; a missing grip never gets a fabricated pose. Source/visibility changes,
reference-space reset, long XR callback gaps and context loss also stop play.

Calibration establishes actual eye height and facing, including `local` fallback.
Seated lateral lean is bounded to 0.45 m; standing to 0.55 m; forward/back lean to
0.35 m; vertical displacement from -0.5 to +0.3 m. Hands must remain within 1.4 m
of the HMD and within the validated launch envelope. Abrupt head/hand jumps fail
closed. These software bounds do not read or replace the Quest guardian boundary.

Physical pose becomes a bounded target offset in the canonical lane, not a direct
fighter position/health write. Head targets clamp to the canonical lane walls;
out-of-lane launch origins are rejected. Rendering follows the validated target.
Bolts expire at canonical lane, lateral wall, floor and bounded height limits.
This is a lean/duck arena, not room-scale walking or free 3D traversal. Controller
dodge/duck provide alternatives and shift the virtual viewpoint; comfort needs
hands-on evaluation, especially at those transitions.

After interruption/recenter/pause, a held trigger cannot fire on resume. A neutral
sample must rearm it. Paused menu triggers are captured; render-frame cast/dodge
edges are consumed by exactly one simulation tick. Software-rendered **desktop**
cadence is allowed to be slow; the physical XR cadence guard stays strict.

### Lifecycle and preservation

Session listeners and reference reset listeners are removed on exit; pending frames
are canceled, buffers/programs/textures are disposed, charge and queued actions are
cleared, tones stop. Session ownership checks prevent late async setup from reviving
an ended/canceled session. Reentry uses fresh render resources and the in-memory match.

The shared renderer now clears the framebuffer once before drawing both viewports.
Previously the second eye's `gl.clear` could erase the first because clear ignores
viewport. The browser test reads both eye regions to protect this correction.

Arena has no progress storage, record/ladder calls or online transport. Original
Descent, Sideways, Memory Arcade, Duel records, VR checkpoint and comfort namespaces
are not read, renamed or migrated by the arena. Normal Descent checkpoints remain
owned by the existing app. Pages copies these relative local modules unchanged;
the separate online/co-op/cloud app remains separate.

## Requirement coverage

| ID | Implementation | Verification / status |
|---|---|---|
| R1 hands | Current tracked 6DoF palms, five fingers, wrist bands, gold/cyan charge seeds | Matrix/pose/finite mesh tests; browser rendering; hardware tracking pending |
| R2 cast authority | Release gesture/current-ray fallback into canonical Lumen Thread | Both hands, simultaneous release, held trigger, miss/cooldown, injected damage rejection; real browser HP change |
| R3 dodge bounds | HMD offsets, swept canonical target, grip/A dodge, left-grip duck | Physical lean/duck dodge, hit while displaced, jump/boundary rejection, wall origins; headset feel pending |
| R4 telegraph/feedback | Locked amber windup, traveling red bolt, hit effects, synthesized panner audio, optional haptics | Locked-line simulation, real WebGL, missing/rejected feedback tests; spatial sound/haptics pending on hardware |
| R5 encounter | Spark vs Archon, canonical KO/rounds/timeout/finisher, restart | Full two-round win and repeat through inputs; no HP/rules mutation in playthrough |
| R6 reusable XR | Versioned input/runtime/adapter; shared renderer; real Descent adapter | Version rejection, Descent execution, old full campaign suite; Sideways adapter deferred |
| R7 comfort | Seated/standing, snap, speed, vignette, recenter, mandatory tracking pause, reduced intensity, exit | Edge/lifecycle/menu/browser tests; subjective comfort pending |
| R8 desktop | Synthetic mouse/keyboard poses, same runtime and renderer | Real Chromium desktop cast, interruption, comfort, subpath/offline checks |
| R9 automation | `tests/vr-ascension.test.mjs`, browser script and existing suite | See receipts; meaningful authority, collision, replay, isolation and cleanup cases |
| R10 Field Lab | Ten new manually marked Ascension checks in existing diagnostic schema | Default not-tested and privacy/whitelist regression tests; no fabricated hardware passes |

## Reproduce software checks

```sh
npm test
node scripts/check-runtime-bridge.mjs
node scripts/build-pages.mjs
node --test tests/pages-static.test.mjs
for f in public/vr/*.js public/duel-{engine,spatial}.js; do node --check "$f"; done
```

Optional real-browser software check (no runtime package changes):

```sh
npm install --prefix /tmp/spark-xr-qa --no-audit --no-fund playwright@1.62.1
node /tmp/spark-xr-qa/node_modules/playwright/cli.js install --with-deps chromium
SPARK_PLAYWRIGHT_MODULE=/tmp/spark-xr-qa/node_modules/playwright/index.mjs node scripts/check-vr-ascension-browser.mjs
```

The script starts its own local server, serves a `/SparkTheSubstrate/` project
subpath, blocks external requests, checks a real canonical cast hit, pause/comfort/
interruption, drives synthetic stereo through real WebGL, verifies both eyes retain
geometry and confirms Descent still renders. It saves browser receipts/screenshots
under ignored `work/vr-browser/`; CI uploads them as an artifact. An installed
Chromium can be selected with `SPARK_CHROMIUM_PATH`. No hardware inference is valid
from these synthetic frames or software-rendered browser pixels.

Local receipts: [verification summary](verification.json), [browser results](browser-results.json),
[source hashes](artifact-manifest.json), [review handoff](review-handoff.md).
The full suite passed 412 tests (386 baseline plus 26 new tests); seven static Pages
checks and the Threshold bridge check also passed. Browser QA passed in Chromium
153 with software rendering. The [arena preview](arena-desktop.png) and
[Descent preview](descent-desktop.png) are desktop screenshots, not headset evidence.

## Quest 3 manual acceptance

Use a trusted HTTPS preview of **this branch**. Open `vr/ascension.html` beneath
that preview's root/project subpath. The existing live Pages deployment will not
contain PR changes until a human merges them. No local Spark/model installation
is needed for gameplay. For desktop only, `python -m http.server 8765 --directory public`
and `http://localhost:8765/vr/ascension.html` are sufficient.

1. Begin seated with a clear space and both Touch controllers. Start with 50% speed,
   30° snap and subtle vignette. Release both triggers. Enter immersive arena; confirm
   correct stereo, scale and two distinct hands with grip position **and rotation**.
2. Hold right trigger still, point at the Archon, release. Confirm charge seed,
   traveling cast and canonical hit/recovery. Repeat with left hand after recovery.
   Aim away and miss: recovery must still apply. Simultaneous release must not
   double damage. A long charge must not increase damage. Test trigger-only mode.
3. During amber windup, observe the warning corridor and sound. After aim locks,
   lean about 0.25–0.3 m sideways or gently duck; let the bolt pass. Confirm a centred
   hit still causes damage. No large steps, jumping or forceful throws are required.
4. Repeat with right grip/A dodge and left-grip duck while seated. Verify limited
   dodge duration/recovery, side selection and no extended immunity. Check the
   camera transitions for comfort; record a failure if abrupt or disorienting.
5. Pause with right-stick click. Left stick selects; either trigger confirms. Change
   posture, movement, snap angle, vignette, intensity, sound, haptics and throw mode.
   Confirm these controls are usable without taking the headset off. Menu triggers
   must never cast; held triggers must remain disarmed until released after resume.
6. Recenter with Y and menu, from both floor and fallback local-space paths if available.
   Confirm calibration and explicit resume. Move gently beyond a software bound,
   then return/recenter and resume; do not intentionally cross the real guardian.
7. Interrupt each controller's tracking, headset visibility and browser focus.
   Confirm immediate pause, hidden missing hand poses, no catch-up burst, no stale
   cast and explicit resume. Test a reference-space reset and repeat enter/exit.
8. Approach/retreat to lane edges with the left stick. Head and cast origins must
   remain inside canonical collision limits. Verify snap turning while off-centre
   pauses at the bound rather than silently expanding it.
9. Finish a full best-of-three encounter (win or loss), wait through canonical round/
   match transitions, restart from the pause menu and complete another encounter.
   Compare original campaign, Sideways, Duel record and VR checkpoint before/after.
10. Exit with B, then via menu on another run. Verify browser return, stopped audio/
    haptics and reliable reentry. Mark Field Lab results manually and explicitly
    download the local JSON if desired. Callback timing is **not headset FPS**;
    stereo viewport counts do not certify visual depth, comfort or tracking quality.

## Honest limits and rollback

- One stylized controller arena; no optical finger tracking, full-body avatar,
  room-scale walking, teleport, six-vessel arena selection, multiplayer or progression.
- Gesture estimation uses bounded recent controller motion and has a current-ray
  fallback. Real latency, ergonomics, controller mappings, audio localization,
  haptics, headset frame rate, stereo perception and comfort remain unverified.
- Arena and new comfort choices last only for the visit. Field reports remain in
  memory until explicitly exported; no pose, save, identifier or network upload.
- Sideways adapter/UI and migration of the existing Descent session host are later
  work. The existing full Descent experience remains operational and tested.
- Changes are additive apart from opt-in canonical Duel hooks and the shared stereo
  clear fix. Roll back the PR commit to remove this candidate; there is no schema
  migration or arena save to reverse. Keep the stereo clear correction if reverting
  the arena independently.

The candidate is prepared for reviewer/proving-ground verification. No independent
verification or release claim is made; final release authority remains human-owned.
