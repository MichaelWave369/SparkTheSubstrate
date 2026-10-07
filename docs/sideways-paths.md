# Spark v0.16.0 · borrowed paths

Choose PC, Controller or Mobile on the start page, then Sideways descent. This release adds nine optional branches to that journey: six vessel trials and three cross-world relic rooms. The actual room graph, HUD and map all contain 36 rooms. The main Descent retains its existing seven worlds and 126 rooms. The original 27-room Sideways route remains sufficient to finish the journey.

The body falls. The spark remembers.

## Vessel trials

Clear the constructs, practice the named action, then use that vessel's Power within the far glyph's 95-step contact area. A nearby glyph pulses; its bottom prompt explains missing requirements. Each successful trial remembers the technique and grants one lasting memory. Repeating a power, reloading or replaying the encounter cannot repeat the reward. Practice is local to the current visit; a reload or room change requires repeating an uncompleted practice, while an earned path stays remembered.

| Vessel | Entry | Trial | Remembered technique |
|---|---|---|---|
| Spark | Mirror Nursery → Unbound Conduit | Hold Jump during a fall, then Lumen pulse at the glyph. | Lumen drift: up to 1.1 seconds of slow descent, formerly 0.7. |
| Computer | Unmoored Harbor → Lantern Grave | Jump, dash in the air, then Overclock at the lantern. | Prism carry: air dash lasts 0.28 seconds, formerly 0.19. |
| Tree | Patient Grove → Unwritten Canopy | Grow a Root hold step, land on it, then wake the far glyph. | Root stair: Root hold grows two temporary steps. |
| Rock | Cold Anvil → Ash Lift | Fault guard at the cracked floor glyph. | Fault descent: Down + airborne Power plunges into a landing shockwave. |
| Animal | Unlit Vestibule → Dreamer's Attic | Jump twice to the upper floor, then Pounce at the glyph. | Feral bound: Pounce after a second jump restores one air jump. |
| Human | Moonless Dock → Vacuum Garden | Reach the garden ledge; hold Guard and use Rally. | Rally ascent: an airborne Rally boosts the body once before landing. |

The Mirror Nursery must first be cleared to unlock vessel resonance. Input maps remain unchanged. Powers use F on PC, LB on a standard controller and POWER on touch. Human Guard uses G, L3 or GUARD. Down + Power uses S/↓, stick/D-pad down or the touch stick aimed downward. Hold Jump uses Space, A or JUMP. Equipment, food, imprints and power cooldowns still carry across vessel changes. Switching vessels cannot reset Rally's once-per-airtime boost or carry Rock's pending shockwave into a different body.

## Cross-world relics and equipment

These names, places and relics already exist in the Descent. They are now also physical discoveries in Sideways. The rooms are optional; the relic gates do not obstruct the main journey or their return door. The map exposes their ? clues before a visit, and a locked door names the relic, its source room and world.

| Find | Source trial | Return to | Wake its glyph as | Merchant recipe |
|---|---|---|---|---|
| Salt Hourglass | Computer · Lantern Grave, Tideglass | Cold Anvil → Unburned Minute, Cinder Clockworks | Human · Rally | Tideblade + Coral Mail: **Tidebound**, 0.4 HP per active second. |
| Ember Moth Wing | Rock · Ash Lift, Cinder Clockworks | Unlit Vestibule → Unplayed Concert, Prism Night | Tree · Root hold on the upper ledge | Thorn Staff + Grove Mantle: **Living Grove**, 0.7 HP per active second. |
| Star Seed | Human · Vacuum Garden, Pale Orbit | Patient Grove → Ninth Bell, Verdant Memory | Rock · Fault guard | Cinder Maul + Furnace Plate: **Cinder Crown**, 12% more strike damage and 3% additional damage reduction. |

A secret grants one lasting memory, scatters 12 physical coins and remembers its journal line and recipe. The coins must be collected. Its alcove cannot be farmed through re-entry, encounter replay or reload. Recipes become available at all existing Sideways merchant and Vault counters. Each Tidebound/Living Grove item costs 8 carried coins; each Cinder Crown item costs 9. A missing recipe dims the button and names the room where it is found. The service handler also checks the recipe before taking money.

Weapon and armor must match for the set bonus. Enhancing the equipped weapon costs 3, then 4, then 5 coins; each step adds two damage, up to +3. Replacing a weapon resets its enhancement. A fall ends purchased equipment and temporary food/loans; keys, relics, learned paths, recipes, memories, imprints and defeated guardians remain. Recovery applies only during active play. Matching equipment has a colored aura and a HUD/counter description; this release reuses the existing vessel bodies and attack animations.

## Saves and scope

- The Sideways key remains `spark-substrate-sideways-v1`, payload schema 2. Schema 1 and earlier schema-2 saves load without new fields. Optional `paths` and `relics` default to empty arrays; the three new secrets use the existing `secrets` list.
- Restore checks canonical values, unique lists, remembered trial rooms, an inhabited vessel, relic ownership and secret-room requirements. Recipe equipment cannot load without the corresponding remembered recipe. A bounded memory limit derives from the actual room graph and reward sources.
- Transient practice, root bridges, held buttons, boost/shockwave state and attack velocities reset appropriately. Bank receipts, loot locations, previous keys/seals, active-tab ownership and equipment remain under their existing rules.
- A prior completed journey opens on its completion panel. **Walk the remembered worlds** resumes exploration from that room. No new journey or deletion is needed to reach the branches.
- Sideways never grants campaign keys, seals, essence or mastery. Only an actual deposit receipt transfers carried coins to the existing device Vault. No branch grants an Archive token. Historical cabinets and their bundled code remain unchanged.
- The seven existing worlds, six vessels, enemy roster, guardians and ending remain. No new cosmology, world, vessel or ending is introduced.

## Graphics and readability

All nine rooms use their own authored ledges. Conduit and Lantern Grave have wider, jumped gaps; Attic and Garden have upper glyphs; the Concert's high step demonstrates Root stair. Additional Canvas motifs include lumen filaments, suspended prisms, root branches, clock/crack shapes, mirrors, a quiet score, orbital seeds and a missing bell. They reuse the existing stage art and load no new image atlas or dependency. Reduced motion makes the new background animation, rune pulse and set orbit static.

Rune labels move above intersecting ledges. Their contact ring matches the 95-step activation area. The map's legend wraps; Return to the path is available at both ends. The map/journal shows learned techniques, collected relic destinations and remembered secret lines. Ground branches are labeled BRANCH, elevated ones UP / BRANCH; relic locks say RELIC. Existing door names, Feather, checkpoint healing, combat verbs and the Memory Arcade remain available.

## Verification

- **313 engine and actual-module DOM tests passed.** Nineteen new cases cover practice/contact/body requirements, one-time rewards, each of the six movement effects, cross-world door conditions, invalid saves, old schema compatibility, fall persistence, equipment matching and purchase locks, map clues and HUD copy. Existing descent, co-op, daily, endless, Duel, Table, Vault and Arcade cases remain in the full suite.
- `node scripts/check-sideways.mjs <old-save.json>` completes the original 27-room route at ordinary health with actual movement, jumps, combat and gates. It earns eight guardian clears, seven keys, six vessels, the Animal Feather and both directions of its shortcut, with reloads between visits.
- `node scripts/check-sideways-paths.mjs <expanded-save.json>` walks all 36 rooms, practices all six trials, collects all three relics, backtracks through actual doors to the three secret rooms, buys and enhances each matched set using earned carried coins, and completes the original final guardian. It uses default health, normal checkpoint healing, zero falls and reloads between visits. No health, damage, enemy deaths, keys, relics, techniques or coins are injected.
- `node scripts/check-sideways-path-ui.mjs <old-save.json> <expanded-save.json>` takes those earned saves through the actual current DOM modules. A completed prior journey reopens, walks back to a new trial, remembers Prism carry/Salt Hourglass through the Power input, updates HUD/map/journal and reloads. The campaign save and banked Vault balance stay unchanged. The fully earned save displays all paths, relics and an active equipment set at a physical merchant.
- Existing economy/deposit acceptance, seven authentic historical cabinet objectives, production build and built Worker checks complete the regression pass. Worker verification covers the current versioned module graph, static assets, D1 two-client co-op, downed/held-E revival and separate progress profiles.
- Nine production Canvas room renders were inspected. A detected Rock glyph-label/ledge collision was corrected; the final label adjustment also keeps Computer and the clock-cache text clear of ledges. These renders use visual fixtures solely to inspect layout, not to establish progression success.

Physical browser-console inspection, gamepad/mobile use, audible quality, browser performance and human balance testing remain live-playtest work. Engine/DOM/Worker checks and native Canvas images do not establish those measurements.
