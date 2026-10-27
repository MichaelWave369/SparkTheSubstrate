# Spark immersive Descent VR — full campaign traversal candidate

**Status: software integration candidate; real Quest 3 acceptance required.**

This version expands the previous **two-room** experimental slice to the
**complete canonical solo Descent room graph**. No room list is manually
duplicated: `VR_ROOMS = Object.keys(ROOMS)` in the real Spark engine.
Automated regression tests enumerate every original exit target across all
seven worlds and confirm it has a VR renderer path.

This is a full *solo progression path* in stylized 3D, **not** a complete
translation of all original 2D assets, Quest-certified release, or XR co-op.

## How to play

1. Open the public GitHub Pages
   [Spark VR entry](https://michaelwave369.github.io/SparkTheSubstrate/vr/)
   after the release PR has merged and the Pages workflow has deployed.
2. To inspect on PC, click **Desktop 3D preview**.
   Use WASD or arrows to move, drag the stage to aim the camera,
   Space dash, F vessel power, E gate interaction, Q next vessel after
   resonance is unlocked, Esc pause.
3. On Quest Browser over HTTPS, press **Enter immersive VR** with controllers
   active. The session is **user-initiated**, stereoscopic, and retains the
   native headset head pose separate from game movement.
4. Left stick: HMD-relative movement / strafe.
   Right stick horizontal: 30° snap turns after neutral reset.
   Left trigger: dash. Right trigger: native vessel power.
   Right grip / A: interact with a nearby canonical gate or secret.
   Right B: cycle vessels *only after* unlocking resonance in Mirror Nursery.
   Right stick click: pause / resume.
5. Spark stops for **real canonical choices** at the proper moments.
   Left stick horizontal selects a decision and A/right trigger confirms.
   On desktop the equivalent is left/right arrows and Enter. All choices
   are shown on-page and on the in-headset HUD:
   - Level-up gifts come from actual `run.choices` and `chooseBoon`.
   - Room karma decisions use `resolveChamber` (liberate, harvest, listen).
   - The Eye offers the canonical `resolveMilestone` decisions
     **continue** or **finish**. Finishing banks an Eye victory.
   - Death/victory requires **explicit memory banking** through
     `settleRun`, then a choice of three `offeredForms` for a new life.
6. Clear guards, collect the **actual** room keys and relics, defeat
   guardians, obtain seals, and travel to The Uncreated with the real
   canonical room/ward/vessel/key restrictions. Gate interaction never
   teleports past an unopened or distant gate.
7. The separate **VR checkpoint** saves automatically during play
   (and after major transitions) and can be saved explicitly from the
   page. It stores only the local VR meta/run state in browser storage
   under `spark-substrate-immersive-vr-v1`.
   **Resume VR checkpoint** restores it in desktop/Quest Browser.
   **New VR journey** deletes only that VR save after confirmation.
   The original Spark Descent, Sideways, Vault, Memory Arcade, and online
   credential keys are never read, rewritten or merged by this path.

## New headset navigation and comfort options

Before entering immersive VR, the player may set **Gentle (50%)**,
**Comfortable (75%, default)** or **Original (100%)** movement speed, a
30° / 45° / 60° snap-turn angle, and an **Off / Subtle / Strong** peripheral
comfort mask. These settings cannot raise original Spark movement speed,
never alter damage or cooldowns, and are saved only in browser-local
`spark-substrate-immersive-vr-comfort-v1`. The actual Descent/VR campaign
checkpoint remains a **different** local-storage key.

Use **left Quest Touch Y** or **M on desktop** (or the accessible
**Show room compass** button) to inspect the current room's canonical
north/east/south/west exits and the exact gate lock reason. The current
room simulation stops advancing while the map is displayed, including enemy
combat. Close the map to return to play. Nothing in the map can override a
canonical locked gate, fabricate keys, or navigate to an unavailable room.

In XR, the map appears **inside the same head-following HUD** already used
for combat/choices. A small, optionally darkened peripheral mask renders
in each stereoscopic viewport, *before* the HUD so route text stays readable.
This is **not** full Quest comfort certification, teleport locomotion or
field-of-view calibration: test physical headset behavior before release.

Also addressed a progression-softlock risk: after death/victory is explicitly
banked into Spark's canonical memory system, the engine remains in the
terminal phase while offering three reincarnation forms. The browser's
choice UI now refreshes based on the **offered decision IDs and the banked
rebirth flag**, not just the unchanged phase string. No earned reward,
metadata or original save schema is modified.

## Seven canonical worlds

| World | VR architectural motifs | Real engine content |
| --- | --- | --- |
| First Stratum | Bronze threshold pillars and instrument hall | The Threshold, Glass, Sepulcher, Warden and 18 native chambers |
| Tideglass Expanse | Aqua conduits and ceremonial obelisks | Pearl Key, Thalassa and tidal hazards |
| Verdant Memory | Root pylons and leaf crowns | Seed Key, Tree gates and the Thornmother |
| Cinder Clockworks | Ember furnaces and mechanical pillars | Ember Key, Rock gates and the Regent |
| Prism Night | Violet dream monoliths | Dusk Key, Animal gates and the Night Weaver |
| Pale Orbit | Lunar relay towers and celestial forms | Orbit Key, Spark gates and the Curator |
| The Uncreated | Elemental monoliths and final ceremonial heart | Six seals, Human gate and Demiurge |

Current 3D rooms are **stylized procedural architecture**, not reconstructed
high-detail environments. Canonical enemy, projectile, fragment, key/relic
and danger-mark positions are represented by bounded 3D meshes. Engine
`ROOMS`, `obstacles`, `stepRun`, `gateStatus`, karma, boons, forms, bosses,
loot, victory and settlement remain authoritative.

## Preservation and technical boundaries

- Static browser WebGL/WebXR, no third-party runtime assets or APIs.
- Canonical game logic is **imported**, not duplicated or patched to invent
  VR-only rewards, collision shortcuts or free unlocks.
- The separate VR save requires Spark's `validMeta` and `validRun`,
  rejects co-op/daily/dungeon/rematch states and caps serialized size.
- Original campaign saves are untouched. Browser storage is per origin:
  Quest Browser does not automatically share a Windows Chrome VR checkpoint.
  No cloud sync or transfer is implied.
- Gate/choice data come from `action-engine.js`; all progression is earned
  through ordinary solo gameplay.
- This edition excludes XR multiplayer, room-scale locomotion physics,
  teleport locomotion, full art/audio parity, hand tracking, passthrough,
  native Meta OS replacement, dynamic platform install, and VR online saves.
- `prefers-reduced-motion` removes decorative UI motion, **but does not
  remove smooth VR locomotion**. First test seated in a cleared play space;
  stop immediately for discomfort.

## CI/software acceptance

`.github/workflows/immersive-vr.yml` performs Node syntax and the complete
Spark regression suite, plus `tests/vr-first-slice.test.mjs` and
`tests/vr-full-descent.test.mjs` for:

- Full room/exit graph and seven-world coverage.
- Canonical swarm-locked and unlocked passage, first gate and beyond.
- Gift, karma, Eye ending and six-vessel unlock/cooldown constraints.
- Once-only death settlement, earned memory bank, legal offered rebirths.
- Separate checkpoint roundtrip and invalid/oversize/cross-mode rejection.
- Generated finite, bounded low-poly scenes, in-world key/relic/mark hints,
  stereoscopic transform math and explicit WebXR session permissions.
- Source and Pages subpath links are checked by existing GitHub Pages CI.

**Passing these tests is not a physical headset pass.**

## Required real Quest 3 finish line (not yet signed off)

- [ ] HTTPS site opens and controller permission succeeds in Quest Browser
- [ ] Correct stereo projection, depth, world scale, floor height and head pose
- [ ] No nausea at seated/snap-turn comfort baseline; accessible exit
- [ ] Controllers: movement, dash, power, grip interaction, adjustable
      snap turning, left-Y compass, pause/resume and unlocked vessel cycling
- [ ] Seated speed settings and Off/Subtle/Strong comfort masks actually
      render in both eyes without covering route/choice text
- [ ] Compass pauses real combat while visible and correctly updates
      nearby locked/open gates without bypassing their requirements
- [ ] Death/victory memory banking immediately replaces the UI choice with
      the three legitimate new-life forms, including after reload
- [ ] Threshold → Glass → Machine gate progression, including blocked gate
      reasons, first real combat and first karma decision
- [ ] Level-up gifts and Eye continue/finish operate inside the headset
- [ ] Key pickup, relic pickup, boss danger warnings, world transition,
      required seals/vessels and no geometry causing view clipping
- [ ] Local VR checkpoint survives page reload and is **not** accidentally
      written into original Spark saved campaign
- [ ] Death → memory bank → offered vessel → fresh life is playable
- [ ] 15-minute practical FPS/thermal/comfort verification on the Quest 3
- [ ] Full progression playthrough without a softlock or fatal WebGL error

## Subsequent finish rungs

1. Physical headset acceptance and fixes, with receipts for the tested
   Quest/browser version and real interactions.
2. Comfort choices: locomotion vignette, optional teleport and adjustable
   turn increments; fix tracking-origin and hands/controller ergonomics.
3. Audio/atmosphere, native HUD interactions, authentic level themes and
   performance budgeting against real headset frame times.
4. Long-run save recovery, boss combat balancing and full real-world
   126-room playthrough coverage.
5. Explicit VR release tag only after the verified finish gates are satisfied.

This is a substantial expansion of a playable prototype. It **must not be
described as Quest-certified or finished** on CI evidence alone.
