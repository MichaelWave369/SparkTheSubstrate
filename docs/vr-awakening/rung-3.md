# SPARK VR: The Awakening Hands — Rung 3

Implemented and demonstrated in software, based on merged Rung 2 at
`2672a66cb07871b4d3ffc6127aeeb7d5fd31e9e0`. Controlling authority is the user's
**Rung 3 — True Spellcraft, Living Guardians & The Giggle Field** build mission.
Physical Quest 3 acceptance, independent review and human merge remain pending.
No production deployment or hardware compatibility/frame-rate claim is made.

Open `public/vr/living.html`. **Classic remains the default** for existing users.
The original `vr/index.html` campaign and `vr/ascension.html` arena remain available.

## Authority and implementation

Tracked current poses → input v1 → shared fixed-step runtime → Descent adapter →
`stepVRPreview` → **canonical `action-engine.js`**. The engine validates the request,
uses the actual equipped attack profile and training, consumes native recovery,
creates/moves/collides shots and calls its existing `damageEnemy`/reward/progression
path. XR cannot supply damage, HP, deaths, rewards or clock resets.

| Contract / component | Ownership |
|---|---|
| `spark.attack-intent.v1`, `attack-intent.js` | Canonical finite geometry, current room/enemy, freshness, replay and bounded-assistance checks; exact cover sweeps; transient event journal |
| `action-engine.js` | Opt-in `directed-v1` basic attacks, native arithmetic, cadence, melee/radial rules, projectile movement and hit resolution; read-only guardian observations |
| `spark.xr.planar-aim.v1` | Validated XR-to-canonical projection; current ray guides and observed target requests |
| Existing input/runtime/adapter v1 | Additive per-hand release edges; one bounded 60 Hz clock; complete neutral rearm; session ownership and interruption protections |
| Vessel / guardian presentation v1 | Six original animations; anticipation, release, recovery, hit/miss; actual Cantor warnings, health, chamber response and victory |
| `spark.xr.spellcraft-preferences.v1` | Separate browser-local control preferences; no campaign-save settings |
| `spark.xr.wrist-world.v1` | Additive combat/guardian observations for a future GenEWrist consumer; no cross-repository integration/dependency claimed |
| `more-bounce.field.v1` | Portable, bounded, original **presentation-only** celebration; no enemy pacification or gameplay mutation |

### Directed attack input

Only an explicit per-step `attackMode: 'directed-v1'` disables automatic basics.
Omitting that field keeps the original auto/manual/surge paths. Mixed legacy
surge/fire flags cannot create extra attacks in directed mode. Unsupported directed
versions fail closed. This extension supports solo campaign play, not co-op, Daily,
Endless or rematches. Those existing modes retain their original controls/rules.

```js
{
  attackMode: 'directed-v1',
  attackIntent: {
    version: 'spark.attack-intent.v1',
    room: 'glass', observedAt: run.time, sequence: 1,
    origin: {x: 500, y: 300}, direction: {x: 1, y: 0},
    targetId: null, assist: 3, hand: 'right'
  }
}
```

`observedAt` is game time, at most 0.2 seconds old and never future-dated. Sequence
is a positive, increasing safe integer (up to 1e9), consumed even when recovery
rejects an otherwise valid request. Room changes and missing/dead/stale target IDs
reject the request. Directions must be unit length within tolerance; geometry is
finite and bounded. Unknown fields, including damage/cooldown payloads, are rejected.
This is local gameplay validation, not a network authentication/anti-cheat protocol.

Origins must stay within 75 canonical units of the actual current player, inside
the room, with clear body-to-hand cover. Hand extension spends part of projectile
travel range, so it cannot add reach. The engine independently checks a requested
enemy's current position, aim cone, reach and cover. Assistance is off/3°/6° and
only rotates a real launch inside that bounded cone. Moving targets can still miss.

Directed shots use native speed, damage, lifetime and fan angles, with swept
nearest-hit collision against canonical enemies, inflated cover and world walls.
Actual traveled distance is bounded. Spark/First Light seekers retain native
steering, restricted to the eligible observed identity; aiming away cannot acquire
an unrelated off-ray enemy. Ordinary Prism volleys do not home unless the existing
training grants it. Changing equipment, training or form never grants an XR bonus.

Human/Animal use the existing cleave reach and `cos(angleDifference) > .05` cone.
Tree/Rock basic waves remain centered on the **player body** with native radius.
Directed basics respect cover. Native vessel **powers retain their original area,
rooting, healing, homing, cover semantics and cooldowns**; a hand ray cannot turn
them into distant free damage. Orbitals/dash specialties remain native passive rules.
A valid basic miss consumes normal recovery. Rejected input never resets recovery
or waits in a queue until it becomes available. Charge has no damage multiplier.

### Pose projection and controls

One metre equals 100 engine units. Inverting the rendered world-root yaw maps
current controller X/Z into canonical X/Y. Rays project horizontally; near-vertical
rays with planar magnitude below 0.2 fail closed. Ray/grip separation is bounded
to 0.25 m; grip/head limits and rigid-matrix validation still apply. The engine
then validates the projected origin/direction independently. There are **no new
anatomical 3D hitboxes**. Height guides presentation; launched visual energy blends
from current hand height into the planar effect lane over 0.18 seconds.

| Profile | Controllers | Desktop preview |
|---|---|---|
| Classic | Either trigger hold/release: native power; native automatic basics | F/mouse power; original movement/dash/gate bindings |
| Spellcraft | Casting-hand trigger hold/point/release: basic; other trigger: native power | F/mouse basic; G power |
| Left-handed | Swap the two combat-trigger roles in the wrist; movement/UI stay familiar | F remains basic, G remains power |

Trigger-only casting needs no motion. The optional bounded forward release gesture
can guide ranged intent; melee retains current controller facing. Free-hand,
untriggered sword/claw recognition is not implemented. Swing speed never adds hits.
All six forms have distinct tracked hands and release animations, actual recovery,
hit confirmation, miss/blocked feedback and optional original sound/haptics.

The wrist contains combat profile, casting hand, assistance, attack name/recovery,
power recovery, target/blocked feedback, boss guidance, all prior inventory,
progression, save/restore and comfort actions. Menus capture both triggers. Changing
combat controls pauses and cancels charge; **all** held gameplay controls must return
to neutral before fresh input is accepted. Both-hand releases are retained once at
high display refresh rates. Tracking loss/recenter/visibility/source interruption
cancels charge and queued actions. Existing seated/standing, movement, snap, vignette,
quality and reduced-intensity controls remain. Descent ducking still changes view
height without granting new immunity; its dash keeps its original rules.

## The real Echo Forge

The native Cantor still begins with 1,100 HP, uses its original AI, six-note rings,
half-health second movement, eight-note rings plus the aimed pair, marked ground,
damage, speed, timings and defeat/reward path. `guardianThreats()` is read-only:
warnings expose the actual locked `aimAngle`/`volleyAngle`, count and remaining
windup. Tests compare warnings with actual released bolt vectors.

Original copper forge pillars/conduits, overhead machinery and a rotating crown
stay outside navigation or above head height. The faceted Cantor has actual-health
bars and numeric wrist health. Floor spokes and shrinking ground-seal rings show
the existing threats. Health thresholds change atmosphere only when native stage
changes. Genuine defeat drives a bounded chamber response, native Ash Cloak/essence
and actual progression choices. There are no fake phases, extra healing or victories.
The second guardian showcase is deferred; its combat remains operational.

## More Bounce (optional stretch)

The portable field lasts 6.9 seconds, radius at most 3.6 m, zero propagation hops,
six decorative dancing echoes and nine bubbles (three at reduced intensity), with
original optional three-note/giggle synthesis and gentle haptics. No camera motion
or physical exertion is required. It expires and clears on room/session changes.
These are harmless celebrants after combat, **not enemies being pacified**.

The in-game clue is deliberately incomplete. There are no purchases, accounts,
online conditions, random drops or physical grind. Source-code secrecy is not claimed.

<details><summary>Reviewer/test unlock conditions (spoiler)</summary>

In the current life: nine distinct canonical mercy decisions, all six legitimately
visited vessels after earned resonance, return to the cleared Echo Forge, alive and
playing with no living enemies. The wrist then offers “Listen between the notes”.
The normal clue does not reveal this full recipe. Activation changes no canonical
state. Browser evidence earns all conditions through actual play and compares the
entire run after expiration against the same native simulation without the field.

</details>

The field cannot write health, AI, rewards, progression or saves. Future games must
decide their own legal pacification rules; no other repository is modified here.

## Preservation and evidence

Checkpoint key `spark-substrate-immersive-vr-v1`, envelope
`spark.vr.local-checkpoint.v1` and run version 2 remain. New optional validated
`shot.directed` launch metadata preserves in-flight cover/range/homing restrictions
across save/restore; no migration is performed. Old checkpoints remain accepted.
Control preferences use only `spark-substrate-xr-spellcraft-prefs-v1`; they are absent
from campaign runs. Transient observations, gestures and More Bounce are not saved.

All 126 rooms, seven worlds, gates, equipment/training, karma, gifts, earned morphs,
endings, rebirth, original desktop controls, Duel/Ascension, Sideways, Echo Lives,
Memory Arcade, online-service boundaries and licensing are preserved. The shared
hub still exits XR cleanly before explicit mode relaunch. No app dependency or
remote runtime asset was added. Golden traces were generated from unmodified main,
not from expected values reconstructed from the new implementation.

| Requirement | Executed software evidence |
|---|---|
| P0 directed intent, misses, timing, cover/range | Canonical input tests plus actual app/browser two-enemy Glass encounter; chosen HP falls while other HP stays unchanged; away shot misses and rapid recast is rejected |
| Six vessels/equipment/training | Six default profiles and six equipment overrides; learned seeking/haste; legitimately earned six-form browser releases/animations |
| Classic compatibility | 48 full-state golden traces match main byte-for-byte: solo/co-op, auto/manual/surge, equipment and native Cantor AI; all 423 previous tests retained |
| P1 real guardian | Input-only Threshold → Glass → Machine → Quiet → Conduit → Cistern → Forge; real second-movement warnings/10-bolt volley, directed hits, defeat, Ash Cloak, save/restore and legal exit |
| Tracking/lifecycle/preferences | Missing/invalid poses, root projection, held-control profile changes, both-hand 120 Hz edges, no resume bursts, recenter, separate preferences and unchanged save envelope |
| P2 stereo/performance/cleanup | Both-eye pixels retained; all qualities with multiple enemies and native strongest Cantor volley plus wrist; zero WebGL errors; WebGL object balances/active audio voices zero after mode exit |
| P3 celebration | Real nine-kindness/six-vessel route; no activation mutation; 430 native ticks exactly match a no-field control simulation; expiration and no save fields |
| Regressions/offline | Full npm suite, static Pages/path checks, runtime bridge and all three browser suites; zero unexpected remote requests |

Receipts: [verification](verification.json), [actual browser results](browser-results.json),
[candidate hashes](artifact-manifest.json). Controlled collision, training and
gate fixtures are labeled; the browser campaign never injects HP, enemies,
room progress, rewards, gear or unlocks. Screenshots are actual software WebGL:
[directed cast](directed-casting.png), [wrist/stereo](spellcraft-wrist.png),
[Forge entry](forge-entry.png), [Cantor windup](cantor-windup.png),
[volley](cantor-volley.png), [victory](cantor-victory.png),
[Human](spellcraft-human.png), [Computer](spellcraft-computer.png),
[Animal](spellcraft-animal.png), [Tree](spellcraft-tree.png),
[Rock](spellcraft-rock.png), [Spark](spellcraft-spark.png),
[More Bounce](more-bounce.png).

### Reproduce and performance interpretation

```sh
npm test
node scripts/check-runtime-bridge.mjs
node scripts/build-pages.mjs
node --test tests/pages-static.test.mjs
# Isolated Playwright 1.62.1 + installed Chromium, as in the Rung 1 guide:
SPARK_PLAYWRIGHT_MODULE=/tmp/spark-xr-qa/node_modules/playwright/index.mjs node scripts/check-vr-ascension-browser.mjs
SPARK_PLAYWRIGHT_MODULE=/tmp/spark-xr-qa/node_modules/playwright/index.mjs node scripts/check-vr-living-browser.mjs
SPARK_PLAYWRIGHT_MODULE=/tmp/spark-xr-qa/node_modules/playwright/index.mjs node scripts/check-vr-awakening-browser.mjs
```

The new browser check loads the actual app under a Pages project subpath, exercises
real keyboard/profile controls, then supplies synthetic current poses through the
actual input/runtime. All three evidence directories are uploaded by VR CI.

Benchmarks use fixed 1200×600 software stereo, eight warm samples per quality,
multiple native enemies or the actual Cantor 10-bolt release, and the wrist visible.
Receipts report submitted vertices/draw calls, buffer-upload bytes, new WebGL object
handles and JavaScript render-submission median/p95. They do **not** measure complete
JS heap allocation, driver/GPU memory allocation, GPU frame time or headset FPS.
Static geometry is cached (four-room cap); dynamic effects, event histories, poses,
audio voices and celebrants are bounded. No 72/90/120 Hz headset claim is inferred.

## Quest 3 manual acceptance / Rung 4

Use a trusted HTTPS preview of this branch at `vr/living.html`. For local desktop:
`python -m http.server 8765 --directory public`, then
`http://localhost:8765/vr/living.html`. Live Pages receives changes only after human merge.

1. Start seated at low movement speed. Inspect both eyes/hands, ray/grip alignment,
   floor/scale, snap turning and all three qualities. Repeat entry/exit.
2. Play Threshold → Glass in Classic; verify the original automatic targeting/powers.
3. Open the wrist, select Spellcraft and neutralize all controls. Point at one of two
   enemies, release a basic, aim away and miss. Check actual recovery and cover.
4. Test stationary trigger-only casting, gentle ranged release gestures, left-hand
   layout and separate native power. No forceful swing, jumping or wide room movement.
5. Earn resonance normally. Identify and use all six forms and any equipped weapon;
   check native melee/radial reach and recovery, hit/miss feedback, and no charge bonus.
6. Read target/blocked state, exact basic/power recovery, health, objective and inventory
   in the wrist. Verify menu confirmation cannot become a spell after resume.
7. Reach the real Forge. Read the Cantor's six/eight-note rings, aimed pair, ground
   seals and health; move between threats, win, collect real progress and continue.
8. Save mid-flight and after victory, restore and continue. Compare original save
   namespaces. Check a pre-Rung-3 VR checkpoint and ordinary desktop modes.
9. During charge/combat interrupt either pose, HMD tracking, visibility and reference
   space; recenter and resume. Held controls must never produce a queued attack burst.
10. Test sound/haptics off/on, reduced intensity, all comfort settings and clean
    mode exit/relaunch. Record actual headset comfort, frame behavior and readability.
11. If the secret is earned, inspect its optional after-battle celebration: no combat
    pacification claim, comfortable motion/audio, natural expiry and clean exit.
12. Record the nine new Field Lab checks manually. They default to **not tested**.

Actual Quest tracking, controller feel, aiming comfort, wrist text, sound localization,
haptics, perceived stereo and sustained performance are **unverified**. Art remains
stylized procedural geometry. There is no optical hand tracking, free-hand melee,
anatomical 3D collision, seamless mode switching, second guardian showcase, active
More Bounce pacification or Sideways XR conversion in this rung.

**Rung 4:** first qualify this build in the physical Quest Field Lab and repair
observed alignment/comfort/performance issues. Then extend the verified guardian
presentation to the Warden and qualify directed-combat ergonomics before a separate
Sideways adapter mission. Rollback is a regular revert; no save migration exists.
Candidate prepared for independent review; release/merge authority stays human-owned.
