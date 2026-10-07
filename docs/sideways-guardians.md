# Spark v0.17.0 · guardian memories

Sideways descent now has **39 connected rooms in the seven existing worlds**, five route relics, six vessel paths and all six matching weapon/armor sets. Three optional rooms finish the remaining equipment routes. The original 27-room route still completes the journey. Existing saves continue without a reset; a completed journey offers **Walk the remembered worlds**.

The body falls. The spark remembers.

## The remaining paths

The map exposes each room's `?` clue before discovery. Doors name the missing technique, relic, vessel or seal. Return doors remain open; none of these optional branches blocks the original route.

| Route | Requirement | At the far glyph | Remembered reward |
|---|---|---|---|
| Unlit Vestibule → The Door Behind Sleep | Nacre's Feather, Cinder seal, Animal and Feral bound from the Dreamer's Attic | Double-jump to the high ledge and Pounce | Night Hunter equipment recipe |
| Origin Seam → The Room Without a Name | All six seals, Human and Rally ascent from the Vacuum Garden | Reach the far ledge and Rally | Unmade Thread and Before the Law recipe |
| Moonless Dock → The Outside Window | Unmade Thread, Spark and Lumen drift from the Unbound Conduit | Lumen pulse at the far glyph | Pale Horizon recipe and The Sky Beyond the Sky journal memory |

The existing feather pickup also appears in the relic HUD and journal. A prior save with a Feather remains valid even if the Reliquary was not cleared when it was collected. The Nursery/Prism Night feather shortcut stays open under its previous requirements.

Each secret grants one lasting memory, scatters twelve physical coins and remembers its recipe once. Repeating a power, revisiting, encounter replay or reloading does not repeat that reward. These are Sideways discoveries: no campaign key, seal, mastery or Archive token is granted.

## Six matching sets

All names and equipment pairs already exist in the Descent. A remembered recipe unlocks both pieces at the existing Sideways merchants and physical Vault counter. The listed cost is per piece and uses carried coins.

| Set | Weapon + armor | Cost | Matching bonus |
|---|---|---|---|
| Tidebound | Tideblade + Coral Mail | 8 | Recover 0.4 HP per active second |
| Living Grove | Thorn Staff + Grove Mantle | 8 | Recover 0.7 HP per active second |
| Cinder Crown | Cinder Maul + Furnace Plate | 9 | 12% more strike damage; 3% additional damage reduction |
| Night Hunter | Night Fangs + Veil Garb | 9 | 7% more movement speed; dash recovers 6% sooner |
| Pale Horizon | Orbit Prism + Astral Aegis | 10 | 10% more melee/bolt reach; attacks repeat 7% faster |
| Before the Law | First Light + Dawn Shell | 11 | 8% more strike damage; recover 0.7 HP per active second |

Enhancements cost 3, 4 and 5 coins, add two strike damage per step and stop at +3. Replacing the weapon resets its enhancement. Recipes survive a fall; purchased gear, food and borrowed imprints belong to the current life. A matching set appears in the HUD, counter description and colored vessel aura. Existing vessel bodies and attack poses are reused; this release adds no weapon-model atlas.

Pale Horizon accelerates both the attack animation and repeat clock, and its ranged bonus preserves the aimed bolt's angle. Recovery stops while paused or in a counter. First Light equipment is separate from the Arcade's optional First light trail.

## Guardian memories

Open **Pause → Guardian memories**, or the same button on the completed journey panel. Defeated Sideways guardians are available; other cards name their arena and remain sealed. This collection has eight fights: Cantor, Warden, Tidekeeper, Thornmother, Cinder Regent, Night Weaver, Pale Curator and the Demiurge.

A memory starts unpaused with **180 HP**, no equipment, no memories, no learned imprints and the vessels already remembered in the journey. Their ordinary powers remain available. Guardian health uses the existing arena values. The practice mode has no coin drops, key pickups, seals, mastery, recipes, food purchases or checkpoint healing. Gates cannot leave a memory; Pause offers **Return to your journey**.

Pause and results use memory copy. A loss shows the guardian's actual remaining HP and percentage. Retry starts only this fight again. Return restores the parent room, injury, build, coins, progress and completion state. Save & return to start keeps the practice encounter for another visit.

`window.SparkSideways` keeps its previous APIs and adds `memories()`, `remember(room)`, `retryMemory()` and `returnToJourney()`. Selection still requires a real defeated guardian and the memories panel; combat uses the same bounded `control()` inputs.

## Existing guardians, different patterns

| Guardian | Sideways pattern |
|---|---|
| Cantor | Existing wind-up ring, aimed notes, low volley and Second Movement banner |
| Warden | Warned low and high horizontal lanes |
| Tidekeeper | Slow outward fans and a tidal ground mark |
| Thornmother | Paired root circles with an open space between them |
| Cinder Regent | Clock ring with a gap facing the position recorded during wind-up |
| Night Weaver | Alternating high fan and low crossing threads |
| Pale Curator | Falling stars on either side of a warned gap |
| Demiurge | Three existing laws: crown ring, marked ground, crossing laws |

Non-Cantor attacks record their aim before firing. Ground marks stay where announced rather than chasing a dodge. Wind-ups last at least 0.95 seconds; the Curator uses 1.2 seconds. Patterns contain at most ten simultaneous bolts per release. Guardian bolts have distinct world colors and short trails; root marks show their actual ground collision region. The boss HUD gives a concise dodge hint. The combat camera moves toward the space between the spark and guardian, keeping their bodies and the approach lanes visible. Death cancels that guardian's outstanding marks and bolts.

Cantor health, first-phase timing, notes and Second Movement behavior were preserved. No new enemy, guardian, world, vessel, cosmology, ending, gore or borrowed move text was introduced.

## Save boundaries

The journey remains `spark-substrate-sideways-v1`, schema 2. Schema 1 and old schema-2 saves still load. The relic HUD derives Nacre's Feather from an existing feather secret when needed. Canonical paths, relic sources, recipe requirements and the actual graph bound restored rewards.

Guardian memories use `spark-substrate-sideways-rematch-v1`, schema 1, linked to the parent journey ID. Its payload contains only encounter position, health, time, damage and guardian health. Reload reconstructs the fixed build and re-announces the next pattern; projectiles, wind-ups and held input are transient. It cannot import equipment, coins, keys or seals. Main save writers reject practice journeys, and practice writes never touch the parent slot. Existing active-tab ownership covers both slots. Return clears only the practice slot.

Campaign, co-op, daily seed, endless, Duel, Vault, binder, Table and all seven historical Arcade cabinets retain their previous schemas. Actual Sideways deposit receipts remain the only bridge from carried wealth to the device Vault. Historical bundles were not edited; The Unwritten remains sealed.

## Verification and remaining live checks

- **329 engine/actual-module DOM tests passed.** Sixteen new memory cases cover locked selection, fixed builds, no-reward boundaries, illegal main-save writes, each guardian's wind-up/phase, canceled death hazards, separately resumed encounters, exact parent return, 5% versus 90% losses, new equipment effects and old Feather saves. Existing mode and co-op regressions remain in the suite.
- `node scripts/check-sideways-paths.mjs <save.json>` earns all **39 clears, six practiced paths, five relics and six equipment secrets**, buys and enhances all six matching sets, and finishes with **zero falls**. It uses real movement, jumps, powers, fights, collected coins, gates, normal health and reloads between visits. No progress or health was injected.
- `node scripts/check-sideways-memories.mjs <earned-save.json> <result.json>` completes all **eight** memories through actual UI inputs at fixed health with no gear. Each fight reloads mid-encounter, reaches its second movement (all three Demiurge laws), pays no reward, and returns to its parent room/build/health/coins. The saved journey, campaign and Vault stay unchanged. Simulated durations were 22.4–49.9 seconds; these are automation timings, not human difficulty measurements.
- `node scripts/check-sideways.mjs <save.json>` completes the original 27-room route at normal health, preserving all eight guardians, seven keys, six vessels and both directions of the Feather shortcut.
- `node scripts/check-sideways-path-ui.mjs <old-save.json> <new-save.json>` reopens an earned older completion, backtracks through doors to a new trial, remembers Prism carry through actual Power input, updates the HUD/journal and reloads. The complete 39-room save displays its relics, recipes and active set at a physical merchant.
- Existing economy/deposit acceptance and all seven genuine historical Arcade objectives passed. Production build and built Worker/D1 acceptance verify the current asset/module graph and two-client co-op, including held-E revival and separate save profiles.
- Native production Canvas renders of the three new rooms and guardian wind-ups/volleys were inspected. Visual fixtures were used only for layout review; the route/replay evidence came from ordinary inputs.

Physical browser-console inspection, audible quality, controller/touch use, real network performance and human balance remain live-playtest checks. DOM, engine, Worker and native Canvas checks do not establish those measurements.
