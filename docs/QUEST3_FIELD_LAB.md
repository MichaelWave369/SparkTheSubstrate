# Spark VR · Quest 3 Field Acceptance Lab

**Status:** experimental. This is a real-device testing aid, **not** certification
and not a declaration that Spark VR is a finished Meta Quest release.

## Open the live page

After the PR merges and GitHub Pages deploys:

- [Spark immersive VR](https://michaelwave369.github.io/SparkTheSubstrate/vr/)
- Entry from the main [Spark homepage](https://michaelwave369.github.io/SparkTheSubstrate/)

No local installs, command line, or USB connection are needed. Use **Quest
Browser** over HTTPS for the hardware test. Desktop 3D preview is useful to
compare behavior, but it does not exercise the immersive frame path.

## One useful test session

1. Charge the Quest controllers and choose a clear, seated testing space.
   Select a comfortable speed, snap angle and optional peripheral mask.
2. Open Spark VR in Quest Browser and press **Enter immersive VR**. Accept
   the headset's explicit browser session prompt. No VR starts automatically.
3. Look around. Check stereoscopic depth and floor height with both eyes,
   including moving your head independently of left-stick locomotion.
4. Move with left stick, turn with right stick, dash with left stick click,
   and use either trigger for vessel power in Classic. **Left X** or right stick
   click opens the wrist. Left Y recenters and pauses; World holds the compass.
   Spellcraft uses the selected casting-hand trigger for basic attacks and the
   other trigger for power. Note any input differences you actually experience.
5. Follow Spark's *real engine* directions through The Threshold,
   Glass Causeway and, when possible, Machine Sepulcher. Test blocked doors,
   true swarm clearance and first real karma/boon decisions.
6. Save a VR-only checkpoint, exit immersive mode and confirm the page
   still works. Reload only after testing the local checkpoint resume
   behavior. The separate original Descent/Sideways saves must be unchanged.
7. Under **QUEST 3 FIELD LAB**, inspect the locally measured session summary.
   Select **Passed**, **Failed**, or **Not tested** for each applicable acceptance
   checks yourself. The page does **not** auto-mark hardware results passed.
8. Press **Download Quest test report (JSON)** or **Copy report** explicitly.
   The site does not upload these measurements and does not retain the
   checklist in a persistent service. A page refresh clears the in-memory
   report, so export before refreshing if you want to keep the evidence.

## What the software can observe

The diagnostic module collects **bounded, aggregate** information:
- Count of explicit WebXR immersive sessions and successfully submitted
  browser XR frames.
- Count of frames for which the browser supplied exactly two `XRView`
  views. This tests API-level stereo setup, *not* what a person perceives.
- Whether an input source advertised a left or right controller, not any
  button values, stick axes, hand position or movement traces.
- Declared reference-space category: `local-floor`, `local`, or `unknown`.
- Recent (maximum 480 samples each) browser XR frame-callback intervals
  and **JavaScript render-submission times**, with median and 95th
  percentile summaries. These are diagnostic clues, **not** GPU timings,
  dropped-frame proof, compositor stats or headset refresh-rate/FPS claims.
- Counts of a fixed allowlist of noteworthy conditions (tracking reset,
  invisible headset pause, controller interruption, fatal render error,
  compass opened/closed, explicit phase choice, checkpoint result).

There are **no captures of video, audio, camera, headset position/orientation,
per-frame stick/buttons, account identity, IP address, full browser user agent,
precise date/time, personal game saves, inventory, room-specific progress,
location or page navigation history.** Diagnostic reports are in memory only.
Automatic telemetry uploads, third-party analytics and background tracking
are not part of this implementation.

The frame sample buffers are capped. Long sessions do not accumulate a
full movement or timing trace. The report contains a schema, manual pass/fail
results, aggregate session measurements, event counts, and explicit
measurement limitations.

## Interpreting a report

- **Two-eye frames reported:** the browser supplied two eye views; manually
  verify they are aligned, comfortable, and actually create depth.
- **One or zero eye views:** investigate session type and XR layer setup.
- **Controller not detected:** check Quest Browser permissions and powered
  controllers before blaming Spark's mapping.
- **Long frame-callback p95 intervals:** try lower headset load, but don't
  label this *headset FPS* or diagnose GPU overload from this alone.
- **High JavaScript submission p95:** investigate scene geometry, allocations,
  WebGL state and JS work; actual GPU/compositor timing requires other tools.
- **One or more manual failures:** share the exported JSON alongside a
  description of what you saw, the Quest browser version (if known), and
  clear reproduction steps. Do not include personal credentials or saves.
- **All checkboxes passed:** useful acceptance evidence from one tester,
  **not automatic Quest certification or a completed 126-room playthrough**.

## Release gate

A real Quest 3 session must validate navigation, combat, original progression,
reincarnation, local saves, clear text placement, stereo comfort and safe
session exit. The 126-room run also needs extended playtesting and a sustained
headset performance/thermal check.

This lab assists that work. It cannot substitute for real headset use, user
comfort judgments, or manual bug reproduction. No original game engine,
backend, cloud save or licensing terms are changed by the lab.

## Rung 3.5 · The Warden Awakens (manual extension)

**Not tested on physical Quest 3.** These checks extend the existing lab; they
do not auto-mark any of its hardware results. Use `vr/living.html` for this
showcase. Keep the existing acceptance report and record these encounter notes
alongside it. A new readiness panel is deferred in favor of the finished boss.

- [ ] Reach the Eye through real campaign gates (or restore your own legitimately
      earned checkpoint). Confirm the Warden begins at the native 1,800 solo HP.
- [ ] Look overhead voluntarily: the great Eye, rings and armor have depth in
      both eyes. No forced view movement, shake, jumping or large gesture.
- [ ] During the first windup, read three locked paths at floor and bolt height.
      They must match the three actual moving bolts; leave marked ground circles.
- [ ] Below half health, observe the changed chamber, five paths, quicker cadence
      and two distinct hounds. Verify the warnings remain readable while moving.
- [ ] Try Classic, then Spellcraft with each dominant hand, including native
      vessel power on the other trigger. Check cooldowns and real HP changes.
- [ ] Try seated/standing, reduced effects, performance quality, movement speed,
      snap turn, vignette and optional sound/haptics. Assess sustained comfort
      and heat/frame behavior; software submission timings are not Quest FPS.
- [ ] Open the wrist and read native boss HP/phase. It must face you, pause play,
      and close to restore the combat view. Check recenter and controller/headset
      interruption; held controls must not fire on resuming tracking.
- [ ] Defeat the actual Warden. Observe the Eye fracture and rising gold while
      combat is paused for rewards. Read actual run essence, seal and resonance.
- [ ] Save at the genuine Eye milestone. Exercise **Finish**; restore that
      checkpoint and exercise **Continue** into Tideglass. Check original saves
      and the separate online service remain independent. Do not bank/repeat
      rewards as a test shortcut.
- [ ] Exit during a windup and after victory. Return to preview/VR and switch to
      Duel. Confirm no orphaned effects, tones, input queues or broken stereo.

Screenshots and repeatable software checks: [Rung 3.5 evidence](vr-warden/rung-3.5.md).

## Rung 4 · Quest reality retest

The creator's first physical session found hand, movement, menu and entry
problems. This revision has software evidence only; **physical retest is pending**.
Keep the existing checklist and its pass/fail history. The five `reality-*`
checks are additional manual results, initially **Not tested**.

1. Visit `/vr/index.html`, `/vr/ascension.html` and `/vr/living.html` separately.
   Enter with the page's button. Record the exact URL and browser version if one
   fails. Deny once and retry. In Living, switch between campaign and arena:
   the first session must end, followed by a deliberate new **Enter immersive
   VR** gesture. Browser permission prompts cannot be approved by the game.
2. Begin seated, hands relaxed around Touch controllers. Move each hand and
   rotate the wrist independently: the gauntlet should follow the grip and the
   fine pointer should follow aim. Open Session → Calibrate hands. Compare the
   reference targets, then adjust size, grip lift/depth/tilt/roll and pointer
   pitch/yaw separately. No campaign time or combat may advance in calibration.
   Check both hands and left-handed Spellcraft; these are controller gauntlets,
   not optical articulated-hand tracking.
3. Open X wrist. Read Combat, Inventory, World, Comfort and Session with each
   eye, seated and standing. Stick up/down scrolls three visible actions;
   left/right changes page. Point the opposite controller at a row/tab and
   confirm with a trigger. Try either wrist and the small fixed floating panel.
   Look up/down; close with X. Verify native gifts and Eye Continue/Finish
   choices remain accessible. Release the confirming trigger before casting.
4. During legal movement, observe native cover/edge feedback. Return from a
   small bounded lean, recenter with Y, briefly obscure a controller, disconnect
   one controller and interrupt headset visibility. The current remaining hand
   must keep following its controller while combat pauses. Read Diagnostics;
   reconnect/restore tracking and choose **Recover when neutral** or Resume.
   Release both triggers/grips and center sticks. No old charge may fire.
   B or the recovery Exit action must always provide an exit path when tracked.
5. Explore Threshold → real Glass combat/rewards → Machine normally. Check gate
   clearance, native cover, enemy visibility and animated machinery. Compare
   reduced intensity and all quality presets. Record sustained comfort, heat,
   frame behavior and panel legibility; software CPU measurements are not
   headset FPS. Save/restore your own earned VR checkpoint and check original
   saves and the separate online service. Do not use test fixtures for rewards.

Hands & controls → Input diagnostics shows only local session/controller flags,
state, mode, quality and fixed error codes. Explicit export adds aggregate state
transition counts; no poses, axes, recordings, identifiers or saves are collected
or uploaded. This is separate from the existing Field Lab's timing report.
Keep both reports with reproduction notes if helpful.

[Bug matrix, route inventory, software captures and limitations](vr-reality/rung-4.md).
