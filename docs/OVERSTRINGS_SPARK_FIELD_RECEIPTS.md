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

## Rung 9: Optical source-state diagnostics

The same opt-in, aggregate-only report now includes
`reported_source_states` with a separate bounded count by side.
These categories describe what **each sampled WebXR callback reported**, not
whether the Quest's actual sensors are faulty.

| Code | Meaning in the WebXR observation | Next physical check |
|---|---|---|
| `valid` | Required wrist, thumb-tip and index-finger-tip positions were reported, finite and not marked emulated | Proceed to compare deliberate pinches and misses |
| `no_hand_source` | No per-side `XRInputSource.hand` was supplied for that callback | Confirm hand tracking is enabled on the headset and the browser supports it; check controller-to-hand switching |
| `no_joint_api` | A hand source lacked a callable `hand.get` API | Record Quest Browser version; this could be an API/support difference |
| `missing_required_joints` | A hand source existed but one or more required joints did not yield a finite pose | Check hand visibility, occlusion and the headset's tracking conditions |
| `emulated_required_pose` | A required joint was flagged `emulatedPosition` and excluded | Treat as unavailable for this optical-only exercise |
| `unavailable_frame` | The WebXR frame, joint getter or reference space was unavailable for that callback | Inspect the XR session setup/visibility lifecycle |
| `unknown_untracked` | A legacy/manual test supplied booleans without the new reason categories | Not a physical root cause; no such code is emitted by the upgraded Quest observer |

Every accepted sample contributes exactly one category per side; sum of each
hand's category counts equals sampled callbacks. These values only appear in
the optional receipt and are not retained unless the tester manually exports
the report. The previous v1 report fields and meaning are preserved, with
one new optional additive `reported_source_states` field.

**Limitations:** The browser can misreport, omit or emulate poses. The
diagnostics are not optical sensor verification, precision/recall, an assurance
of full hand geometry, or evidence that a physical pinch occurred. No raw
joint coordinate data leaves the optical observer or enters the receipt.
An accepted visual echo still requires explicit one-shot consent; no real
Spark spell is triggered.

### Failure triage on Quest

Start a field receipt, arm one WebXR echo, enter immersive mode and expose
each hand in turn. After leaving VR, inspect the reason counts. If all samples
say no hand source, investigate headset/browser hand input and controller
switching *before* tuning gesture thresholds. If the required joints are
mostly missing, try avoiding occlusion and comparing lighting. If the
hand frames are valid but pinch counts stay zero, gather a deliberate
repeated-pinch field observation and evaluate the heuristic separately.
Do not label these categories as confirmed hardware defects.
