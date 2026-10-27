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
4. Move with left stick, turn with right stick, dash with left trigger,
   invoke a vessel power with right trigger, open/close the compass with
   **left Y**, and pause/resume with the right stick click. Note any input
   differences you actually experience.
5. Follow Spark's *real engine* directions through The Threshold,
   Glass Causeway and, when possible, Machine Sepulcher. Test blocked doors,
   true swarm clearance and first real karma/boon decisions.
6. Save a VR-only checkpoint, exit immersive mode and confirm the page
   still works. Reload only after testing the local checkpoint resume
   behavior. The separate original Descent/Sideways saves must be unchanged.
7. Under **QUEST 3 FIELD LAB**, inspect the locally measured session summary.
   Select **Passed**, **Failed**, or **Not tested** for each of the 12 acceptance
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
