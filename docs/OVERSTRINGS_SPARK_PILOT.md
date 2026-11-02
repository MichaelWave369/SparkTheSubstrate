# Spark × OverStrings — Visual Echo Host Pilot

**Status:** First reviewed integration candidate. Safe visual-only host response. Actual Quest hand-to-game input remains unverified and **not connected**.

## Why this exists

OverStrings Rungs 1–5 can track and record Quest WebXR joints in its own page, compare gesture phrases manually, and produce a one-shot advisory action-intent. Spark is a separate web app with its own gameplay authority. This pilot exercises the receiving side of the integration without treating browser events as trusted game input.

## What changed

- A pinned copy of `OverStrings/web/host-sdk.mjs` from commit `d327cacaca827777c887e6d6a5766012779fc617` at `public/vr/vendor/overstrings-host-sdk.mjs`. License: MIT. No remote runtime dependency.
- Pure `public/vr/spark-overstrings-bridge.mjs` is a narrow Spark-only adapter to the allowlisted `spark.cast` action. The callback produces a frozen `spark.overstrings.echo.v1` visual-echo receipt.
- On `/vr/`, there is a separate opt-in Resonance Echo panel. Arming is one-shot; synthetic demo input is disabled until the user explicitly selects Synthetic and checks its own permission.
- On acceptance, the **existing Spark page** shows a harmless glowing HUD echo. The canonical engine, health, cooldowns, rewards, saves, menus, wrist position and game controllers are not touched.
- Failed, stale, replayed or wrong-game intents do not produce a visual echo. Changing input mode or losing focus disarms. Intent labels and source fields are untrusted.

## Desktop acceptance steps

1. Open the **Spark Immersive VR** page at https://michaelwave369.github.io/SparkTheSubstrate/vr/ after this PR merges and the Pages workflow deploys.
2. Scroll to **OverStrings × Spark: Resonance Echo**. Select **Synthetic desktop test**.
3. Tick **Explicitly allow synthetic sandbox input**. Click **Arm one visual echo**.
4. Click **Trigger synthetic preview**. A glowing Spark resonance echo should appear on the page. No spell, damage, cooldown, progression or checkpoint change.
5. Click again: the second action must not fire without a new arming.
6. Change source or uncheck the synthetic opt-in while armed and verify the arming is revoked.
7. Try the normal desktop 3D preview and Quest Touch controllers. Existing movement, casting and pause functions should remain unaffected.

## What this does NOT do

- No direct inter-tab, cross-origin or cross-page action delivery from https://michaelwave369.github.io/OverStrings/. That browser page publishes a CustomEvent *inside its own document only*. This pilot listens for same-document events and a user-triggered synthetic example.
- No live Quest optical joint tracking on the Spark page, automatic motion matching, new spellcast from a gesture, calibration, Wi-Fi tracking, cross-app permissions, websocket/HTTP transport, or native VR input mapping.
- The page HUD echo is **DOM overlay**, not yet rendered into the immersive stereoscopic headset view.
- No biometric identification, confidence/probability claims or physical Quest measurements.
- A same-page CustomEvent can be forged. Version, age, allowlist, cooldown and sequence checks make accidental inputs less likely, but are NOT an authentication scheme. A real game action requires new explicit in-app permission and its own game-state validator.

## Portable host action schema

Expected advisory input: `overstrings.action-intent.v1` with `advisory:true`, `mode:'practice'`, `action_id:'spark.cast'`, `source:'webxr'|'synthetic'`, `sequence`, `timestamp_ms`, and nonblank `template_label`.

Accepted visual output: `spark.overstrings.echo.v1` with `text:'Resonance echo'`, `action_id`, `source`, and `sequence`, no raw pose data or player object.

## Next rung after headset field tests

Review real Quest recordings and determine reliability. Then integrate a same-page opt-in gesture matcher inside one Spark mode, preserving controller fallback, a visible pause/disarm mechanism and explicit gameplay command registration. That should be a **separate PR** after measured false-positive results. This pilot's visual callback must not be repurposed as direct combat authorization.

## Verification

Node tests in `tests/vr-overstrings-pilot.test.mjs` cover opt-in, one-shot, replay, foreign actions, synthetic provenance, malformed/stale events, immutable receipts and static app isolation.
The existing Spark immersive CI and Pages CI run Node tests plus gameplay/browser checks. The Ascension browser smoke test also serves ESM with the correct .mjs JavaScript MIME type and exercises the local synthetic echo in the actual Spark /vr/ page. Quest hardware testing is still manual.

## Rung 6: Same-page optical Quest hand probe (review candidate)

- The Spark VR instance-local **sidecar** requests optional `hand-tracking` only if
  the user chooses WebXR in the OverStrings panel and clicks **Arm one visual echo**
  before **Enter immersive VR**. Otherwise the original `local-floor` request
  and controller pipeline remain unchanged. The frozen `spark-xr-runtime.js` file
  stays byte-identical to its protected baseline; a wrapper around only this
  Spark instance's XR factory adds the optional feature and a separate
  read-only XRFrame observer.
- Real `XRFrame.getJointPose` is read only from `XRInputSource.hand`; missing,
  emulated or invalid joint data is discarded. The original OverStrings
  `GestureTracker` classifies simple pinches after 130ms dwell; 200ms of missing
  optical tracking closes the active gesture. These values are preliminary.
- A first left or right pinch start, once armed, creates an advisory practice
  intent under the existing Spark host allowlist and emits **one cosmetic echo**.
  This is *not* the Rung 3 trained Liquid/Digits matcher and no gameplay spell is cast.
- No raw joints, optical videos, camera sensors, data uploads, gesture templates,
  persistent consent, background capture or identity recognition.
- The classic Touch controller input path and the canonical gameplay engine are
  unmodified. If Quest switches entirely to optical input, the existing controller
  input validator may pause the gameplay. This pilot observes optical hand motion
  separately rather than introducing an unsafe controller emulation layer.
- The visual echo is on the browser page and may not be visible in the immersive
  headset. Exit VR to review the page status. The next separate rung can render a
  real stereoscopic in-headset echo after hardware validation.

### Physical Quest test sequence

1. Open Spark's `/vr/` page in Quest Browser. Select **Quest optical hand tracking**
   and press **Arm one visual echo**. Keep the synthetic consent checkbox off.
2. Enter immersive VR. Accept the browser's WebXR session prompt. Confirm that
   the headset exposes `XRInputSource.hand` by taking off Touch controllers and
   making your hands visible, according to Quest hand-tracking settings.
3. Hold a left-hand pinch for about 130ms and release. Repeat with the right hand
   after re-arming in the browser page. The demo is one-shot, so a second pinch
   must not produce a second action without explicit rearming.
4. Exit VR, examine the local `overstrings-optical-status` and echo preview.
   No tracked hands should produce a clear untracked result, never a fake pass.
5. Verify Touch controller locomotion, pause, escape and casting work normally;
   note if the game pauses when controllers are replaced by optical hands.
6. Test partial occlusion, tracking loss, left-handed use and session interruption.
   Report false detections and missed pinches before any gameplay integration.

**No actual headset pass is claimed by software-only tests.**

## Rung 7: Brief stereo Quest optical feedback (PR candidate)
- A sidecar now **reuses Spark's existing in-headset alert panel**, in both eye views,
  to show a short optical-hand status and a one-shot accepted pinch echo.
  The protected XR runtime and WebGL renderer source files are unchanged.
- The scene is **shallow-copied for rendering only**. Combat, movement, controller
  bindings, pauses, saves and native Spark status/error messages are never modified.
- The field HUD appears only after the user explicitly arms WebXR optical testing
  and keeps **Show brief optical/echo notices** enabled. There is no persistence.
- Notices last up to 1.6 seconds, yield to Spark error/diagnostic alerts,
  and are suppressed during pause or calibration.
- This makes optical feedback potentially visible inside the headset rather than
  relying solely on the companion 2D browser overlay. Actual text placement,
  legibility and comfort have **not** been verified on Quest hardware.

### Physical acceptance
1. Open the Spark /vr/ page in Quest Browser; select WebXR and arm once.
   Leave the stereo notices checkbox enabled.
2. Enter immersive VR. Look for a short "OVERSTRINGS / SEARCHING FOR HANDS"
   notice (if the session supplies the normal stereo HUD).
3. With optical hands reported by the browser, confirm a short left/right status.
   Hold a left or right pinch for ~130ms. Expect ONE visual-only "PINCH · ECHO".
4. Confirm no repeated echo without rearming and no optical or synthetic spoofing.
5. While testing, verify Spark's pause, calibration and native recovery warnings
   override the optional OverStrings message.
6. Disable the checkbox and retry to confirm no optional stereo notices appear.
7. If a Quest switches to optical hands and the game pauses for controller loss,
   report it; this prototype does not emulate Touch controllers or bypass safety.

CI includes synthetic stereo-scene wrapper tests and normal browser regression.
No software test can certify the physical Quest display.
