---
name: spark-quest-input
description: Spark Quest controller, calibration, input recovery, wrist panel and comfort checks for native WebXR, with real hardware acceptance boundaries.
---

# Quest 3 control authority

Read public/vr/spark-xr-input.js, public/vr/spark-xr-runtime.js, public/vr/spark-xr-calibration.js, public/vr/spark-xr-panel.js, public/vr/spark-vr-comfort.js, tests/vr-reality.test.mjs and docs/vr-reality/rung-4.md.

Maintain distinct grip pose and pointing ray; visually tracked controller hands are not optical hand tracking. Preserve both hands during a single-controller interruption. Invalid pose must fail closed without stale held actions. Preserve neutral rearm, controller and visibility interruption, explicit XR permission and safe exit.

Keep the existing compact paged wrist UI and fallback placement. Respect left/right Spellcraft settings, Classic auto attacks, native cool-downs, seated/standing mode, reduced effects, recenter and comfort options. No synthetic head shake. Browser stereo checks and test fixtures cannot certify physical Touch accuracy, GPU FPS or user comfort; use docs/QUEST3_FIELD_LAB.md for manual acceptance.
