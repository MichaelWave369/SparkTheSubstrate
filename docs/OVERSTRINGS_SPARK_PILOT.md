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
