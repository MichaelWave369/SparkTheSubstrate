# Spark × OverStrings: Quest Field Receipts (Rung 8)

## Why this rung exists

Software CI can test matching logic and its safety gates, not whether a Quest 3
actually provides reliable hand poses in Spark. A proper hardware test needs
measured observations and separate notes from the tester, not invented confidence
scores. This page uses an *opt-in, aggregate-only* field receipt.

## What is counted

While an explicitly armed **WebXR** session is accepting hand samples:
- Total sampled callbacks (labeled sampled frames, not guaranteed unique display frames).
- Samples with a valid reported XRHand wrist and fingertip pose for each hand.
- Per-hand transitions from a reported valid sample to no valid sample ("dropouts").
- Left and right debounced `pinch start` events.
- Accepted one-shot cosmetic left/right echoes from Spark's local host adapter.
- Relative opt-in capture duration, capped at 1 hour in the report.

Capture ends at the first accepted visual echo, explicit disarm, tracking
interruption or session end. A report **does not cover the rest of the session**
after a one-shot echo. A user can add explicit manual counters for a correct
echo, a missed attempted pinch, an unexpected echo or unreadable stereo HUD
after the capture ends. These are subjective *labels* for later review, not
automated truth.

The reported hand-frame percentage is the fraction of sampled callbacks with
at least the required joints. It is **not** tracking accuracy, spatial error,
recognition precision, recall or a detection success rate. A negative test
may contain zero valid poses without implying a device hardware defect.

## Quest 3 field procedure

1. Open https://michaelwave369.github.io/SparkTheSubstrate/vr/ on Quest Browser,
   select **Quest optical hand tracking** in the OverStrings panel.
2. Check **Collect coarse XRHand counters for my next WebXR test**, which is
   off by default. Leave synthetic permission off. Optionally enable the
   short stereo field HUD. **Arm one visual echo**, then enter immersive VR.
3. Present the left or right hand and deliberately pinch once for at least
   130 ms. Observe optical hand recognition and the cosmetic echo.
4. Exit VR. Inspect the on-page field report. Add your observed classifications
   using Correct echo / Missed pinch / Unexpected echo / Hard-to-read HUD.
5. Choose **Copy aggregate JSON** or **Download aggregate JSON** only if you
   want to retain/share the evidence. No background upload takes place.
6. Repeat using the other hand, partial occlusion, controller-to-hand switching
   and different lighting. Export each run before the next run replaces it.
7. Click **Clear field report** to discard the in-memory data.

## Boundaries

- Only real-format, non-emulated `XRInputSource.hand` observations enter
  the receipt. Synthetic demo buttons do not produce a receipt.
- No pose arrays, joint angles/positions, movement trajectories, device IDs,
  IPs, usernames, camera API or wall-clock start times are included.
- No analytics, cookies, remote calls, localStorage or indexedDB are used by
  this subsystem. All counters vanish on reload if not explicitly exported.
- No changes to protected Spark runtime, game renderer, controller pipeline,
  canonical progression, energy, saves or permissions.
- Captures stop automatically on a one-shot echo and do not imply continuing
  unseen sensor monitoring. The UI cannot prove the user's physical gestures.
- CI uses synthetic joint fixtures and Node tests. It **cannot** certify Quest
  tracking fidelity, left-hand comfort, performance, lighting/occlusion
  robustness or in-headset display readability.

## Acceptance

Run `node --test tests/vr-overstrings-field-receipts.test.mjs`.
Verify opt-in starts from unchecked, synthetic does not produce evidence,
bounded counters and dropout transitions are deterministic, malformed samples
are rejected, reports contain no raw pose/identity fields, the correct/missed
labels require a completed capture and clearing removes the report.

The browser UI test should confirm synthetic preview never enables export.
The protected runtime and renderer hash tests must remain unchanged.
