# SPARK VR · Rung 4 — Quest reality pass

Reviewable software candidate based on merged main
`a1f59bd1649af0ea6c145a2af94463bb502748ca` (PR #24). Physical Quest 3 retest is
**not performed**. The creator's written hardware report controls this work.
No Quest image attachments were accessible in this request/workspace, so these
findings do not claim inspection of those pixels. The existing Spark poster
provided palette and silhouette direction.

## Bug → fix → evidence

| Hardware observation | Reproduced cause / scope | Change and evidence |
| --- | --- | --- |
| Oversized, awkward hands | Old mesh assumes a pointing-like grip orientation; old desktop poses used identical ray/grip orientations and masked the mismatch | Human-scale closed gauntlets use controller grip axes, complete left/right reflection and corrected winding. Current target ray remains independent. [Same-pose before](hands-before-same-pose.png) / [after](hands-after-same-pose.png); bounded transform tests |
| Hands freeze when one pose drops | Input returned before populating either visual hand | Populate each valid current grip before failing gameplay closed. One hand keeps moving while the other is missing. [Recovery capture](living-recovery.png); input/browser tests |
| Intermittent movement sticking | A refused off-center snap turn retained the invalid yaw; stale previous-head pose could repeatedly reject recovery; neutral wait lacked an explanation | Roll back refused turns; clear interrupted pose history; align radial deadzone and arming; explain held controls and native collision. Preserve original physical envelope and require explicit recovery after interruptions |
| One unidentified entry unresponsive | Three immersive implementations had divergent lifecycle/input behavior; the original failed hardware URL is unknown | All three routes use the same XR runtime, with launch-pending/rejection/cancellation feedback. Actual DOM tests cover denial, retry, teardown and re-entry. Hardware cause is not established |
| Giant clipped menus | Flat command list on a large floating rectangle; wrist placement did not use both eye frusta | 30 × 22.5 cm panel, five pages, at most three actions, scroll and ray/stick selection; raw wrist anchor with a small floating fallback fixed when opened. [Stereo capture](living-xr-wrist.png); realistic asymmetric eye tests |
| Primitive environments | Single-color boxes/grid and generic silhouettes | Original bevel masonry, arches, luminous inlays, gate ribbons, room-specific silhouettes and ordinary enemy figures. Three playable rooms use reusable components; canonical footprints remain unchanged |
| Spellcraft untested on hardware | Software evidence cannot establish physical usability | Existing legal attack rules retained. Left/right, pause/rearm, canonical Cantor/Warden and software browser checks pass; physical directed-casting retest remains required |

These fixes address reproduced defects. They do not establish that every source
of the creator's intermittent stall has been found.

## Controls and recovery

X / right-stick click opens the wrist. Left stick up/down selects and scrolls;
left/right changes Combat, Inventory, World, Comfort and Session. Either trigger
confirms. The opposite controller's current ray can select rows/tabs. Yellow
selection, a pointer dot and row count identify the active command. Native
progression choices automatically open Combat. Inventory lists earned keys,
seals, relics and available transformations; World exposes native gate status.
Save/restore and mode/exit actions remain in Session.

Session includes calibration, diagnostics, recovery, either wrist attachment and
the floating alternative. Calibration uses a frozen reference-space display;
there is no test enemy or progression. Size, grip-local lift/depth/tilt/roll and
pointing pitch/yaw have conservative bounds. Grip art offsets do not change raw
combat origins, reach, collision or tracking validation. Ray rotation keeps its
exact tracked origin. These are Touch controller gauntlets, not optical hands.

Initial entry may acquire controllers once they become valid and neutral. A
later tracking loss, visibility change or disconnection pauses play. The
remaining valid controller can use the recovery-only menu. Recover waits for
valid tracking and neutral controls; recenter and Resume are explicit. Held
attacks, queued edges and old charges are canceled across these transitions.
Native collision/room-edge blocks, safe-boundary violations, pose jumps,
disconnection, tracking loss, pause and neutral wait have visible reasons.
No safety radii or native collision/dodge rules are relaxed.

Live diagnostics are local aggregate flags/counters with fixed error enums.
They contain no raw poses, axes, device identity, recordings or campaign data.
Export is explicit. Calibration alone uses a new browser preference key,
`spark-substrate-xr-calibration-v1`; gameplay save schemas/namespaces are intact.

## Entry inventory

| Entry | Campaign / encounter | Software result | Session behavior |
| --- | --- | --- | --- |
| `vr/index.html` | Established Descent checkpoint | PASS | Shared XR runtime; original keyboard desktop preview retained. Tracked desktop calibration is in Living; this page explains that fallback |
| `vr/ascension.html` | Isolated canonical Duel | PASS | Shared XR runtime, repeatable encounter; no campaign rewards |
| `vr/living.html` → Descent | Canonical campaign | PASS | Shared XR runtime and established VR checkpoint |
| `vr/living.html` → Arena | Isolated Duel | PASS | Cleanly ends the old session; new Enter VR gesture required |

Pages remain independent documents. Navigating between URLs exits the old
session. Mode selection within Living also ends immersion deliberately; no
seamless session-switch claim. Permission denial, unsupported WebXR, pending
prompts, canceled late sessions and frame/context errors report feedback.
Duplicate requests are blocked, and failed entry leaves the Enter button usable.
The browser still owns permission and immersive user activation.

## Actual rendered evidence

Every PNG below is Chromium 153 / SwiftShader output from the running game.
Stereo uses separate Quest-like grip/ray poses and asymmetric 64 mm eye views.
The XR provider/layer are simulated, not a native headset session. The mesh-only
comparison renders the frozen Rung 3.5 hand function in the **same pose and current
stage**. It is distinct from the unchanged-main room/menu captures under `before/`.
New room captures follow native input through Threshold, real Glass combat and
Machine; they are not generated artwork. They do not prove a complete natural
126-room campaign playthrough.

| View | Baseline merged main | Rung 4 |
| --- | --- | --- |
| Controller hands, same pose/current stage | [Old mesh](hands-before-same-pose.png) | [Mirrored controller gauntlets](hands-after-same-pose.png) |
| Threshold | [Before](before/threshold.png) | [Vault, masonry and open gate](threshold-after.png) |
| Glass Causeway | [Before](before/glass.png) | [Native combat and new architecture](glass-combat-after.png) |
| Machine Sepulcher | [Before](before/machine.png) | [Brass/obsidian machinery](machine-after.png) |
| Wrist | [Before](before/wrist.png) | [Compact panel in both eyes](living-xr-wrist.png) |
| Calibration / recovery | — | [Frozen calibration](living-calibration.png) / [missing-pose recovery](living-recovery.png) |

Standalone entry screenshots and full machine-readable assertions are in
[browser-results.json](browser-results.json). CI also uploads all five browser
suites' rendered evidence. No new runtime asset, app dependency, paid service,
texture atlas, shadow pipeline or post-processing pass is introduced.

## Verification and performance

- `npm test`: **479 passed**, 0 failed (459 baseline + 20 new targeted tests).
- `node --test tests/vr-*.test.mjs`: **111 passed**, 0 failed, including original
  Cantor and Warden timing, summons, attack authority, victory and Eye decisions.
- `node --test tests/pages-static.test.mjs`: **7 passed**; Pages staging and all
  browser imports also run at `/SparkTheSubstrate/` with remote requests blocked.
- All five real Chromium/software-WebGL suites pass: Ascension, Living,
  Awakening, Warden and Reality. The new suite uses actual DOM entry/calibration
  buttons, real application/runtime and GL; simulated XR frames test launch
  failures, both hub modes, recovery, legal casting, stereo and teardown.
- Browser module parsing and `git diff --check` pass. GPU resource counts and
  audio voices return to zero on each tested exit, and the bounded CPU room cache
  is cleared. No browser errors or remote
  requests in the Reality run.

Room static geometry stays below the **existing 180,000-float / 30,000-vertex**
cap at all three qualities. Static meshes are cached. Active play no longer
rebuilds paused command menus and inventory snapshots every frame. Beveled tile
tops omit hidden faces; duplicate generic room ribs were removed rather than
raising that cap.

Machine sample: two eyes, hands and paused wrist, eight measured submissions
after one warmup. All presets use 10 draw calls and allocate **zero new GL
buffers/textures/programs** in these samples. Dynamic CPU arrays still exist.
The exact vertex/upload/timing receipt is [browser-results.json](browser-results.json).
These short software CPU timings are noisy, exclude GPU completion, and provide
**no Quest FPS, sustained thermal or comparative hardware-speed claim**.

Core engines, planar attack authority, guardian presentation, save validators,
save namespaces, More Bounce unlock logic, MIT license, dependencies, Pages
builder and online services are byte-identical to the base. The adapters add
read-only movement observations around the same canonical simulation steps.
Legacy desktop keyboard controls are retained; immersive controller bindings
now match the shared hub and are documented on the page. Four old source-wiring
assertions were updated to follow the shared runtime; behavioral regressions
remain. Exact protected-file hashes and commands are in
[verification.json](verification.json).

## Remaining unknowns and headset retest

Quest alignment, text size, comfort, sustained GPU/thermal behavior, browser
permission behavior and directed Spellcraft have not been physically retested.
The source report does not identify the third failed route. New art establishes
a stylized procedural foundation; the other 123 rooms retain their existing
themes. No new boss, mode, combat system, save migration or reward shortcut.

Use the [Rung 4 Field Lab checklist](../QUEST3_FIELD_LAB.md#rung-4--quest-reality-retest):

1. Enter each URL, deny/retry once, then switch both Living modes with explicit
   exit/re-entry. Record the exact URL if anything fails.
2. Check both controller gauntlets, independent pointers and calibration at
   relaxed seated/standing poses; try left-handed casting and native power.
3. Read all five pages in each eye; try both wrists, the floating alternative,
   ray selection and native progression/save choices.
4. Interrupt tracking/controllers/visibility, neutralize held controls, recover,
   recenter and exit. No queued attack or unexplained movement stall.
5. Play the three opening rooms, compare quality/reduced intensity, and check
   native rewards/save compatibility plus sustained comfort and heat.

Human review and a physical retest remain the release decision. This PR does
not merge or deploy automatically.
