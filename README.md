# Spark: The Substrate — Descent

**Free-to-play flagship · proposed MIT open-source launch.** The original
software is prepared for MIT licensing through [LICENSE](LICENSE). Original
artwork, archived editions, third-party dependencies, server disclosures
and historical logs require final clearance before this private repository
is made public. See the [public release checklist](docs/OPEN_SOURCE_RELEASE.md),
[asset review](ASSETS_AND_ATTRIBUTION.md) and [security policy](SECURITY.md).
The existing browser game and experimental two-room VR slice are not a
claim that every Quest 3 behavior has been physically accepted.

## Experimental immersive VR · first two rooms

The new [Spark WebXR lab](public/vr/index.html) is an **opt-in, separate**
stereoscopic VR and desktop 3D slice of The Threshold and Glass Causeway. The
native Spark Descent rules still own player movement, gates, combat, dash and
Lumen power. Quest Touch left-stick movement, snap turning and interactive
gate controls are wired for an HTTPS WebXR browser. The prototype does **not**
touch campaign, Sideways or Memory Arcade saves and makes **no** real-headset
performance claim. See [VR scope, controls and physical acceptance](docs/vr-first-slice.md).
The full original game and its many modes remain unchanged.


Version 0.17.0 · **guardian memories** finishes the remaining Sideways routes: **39 rooms**, **five relics**, all six matching equipment sets, and three optional branches through the existing worlds. Nacre’s Feather opens the Door Behind Sleep; the Unmade Thread returns from the Room Without a Name to the Outside Window in Pale Orbit. Night Hunter, Pale Horizon and Before the Law add movement, reach, attack-speed and recovery options.

The eight existing guardians now have readable side-view patterns drawn from their Descent fights. **Pause → Guardian memories** replays defeated guardians with fixed 180 health and no gear or rewards. Replays save separately, show remaining guardian HP on a loss, and return to the exact journey room with its build, injury, coins and progress preserved. Existing Sideways saves and the original route continue. Verification: 329 tests, a normal-health 39-room walk with zero falls, all eight UI-controlled replays with in-fight reloads, older-save backtracking, deposit/economy and authentic Arcade regressions. [Routes, controls, save boundaries and release evidence](docs/sideways-guardians.md).

Version 0.16.0 · **borrowed paths** expands **Sideways descent** to 36 connected rooms within the seven existing worlds. Six optional vessel trials teach Lumen drift, Prism carry, Root stair, Fault descent, Feral bound and Rally ascent. Find the Salt Hourglass, Ember Moth Wing and Star Seed, then return to other worlds to open three secrets and unlock the Tidebound, Living Grove and Cinder Crown weapon/armor recipes. Match and enhance purchased gear at existing merchants; a matching set adds its own recovery or damage effect. The map's ? clues, colored power glyphs, relic HUD and journal explain where to go. Nine room layouts and bounded background motifs accompany the branches.

Existing Sideways saves continue in place. A completed journey opens directly on its ending panel; **Walk the remembered worlds** returns it to exploration. Learned paths, relics and recipes survive a fall; purchased gear remains specific to a life. Campaign keys, seals, essence, mastery and Archive tokens remain separate. The original 27-room route still completes without the optional branches. Verification: 313 engine/DOM tests; a normal-health 36-room walk earning all paths, relics and secrets, buying/enhancing all three sets and reloading between visits; a completed older-save backtrack through the actual UI; the original route and seven historical Arcade objectives. [Routes and release evidence](docs/sideways-paths.md).

Version 0.15.2 completes the identified **Memory Arcade** collection with **First Forge v0.4.0** and **First Mastery v0.7.0**, both recovered from their actual Git source. Discover the amber forge terminal after the Cantor in the Echo Forge, and the green terminal at the Moonless Dock as Computer. Return to the Threshold’s physical Arcade to play them. Earn old essence and enhance an item in First Forge; bank old mastery, learn a vessel skill and use its power in the next life in First Mastery. Seven authentic cabinets now award seven unique Archive tokens; historical resources stay in their private saves. The gallery, trophy shelf and sealed hook expand with the room. The Unwritten stays sealed.

Verification for v0.15.2: 294 tests, all seven genuine historical objectives at normal health, both new discovery/backtrack/play/reload/reset flows, and production Canvas inspection of the new cabinets, terminals and seven-trophy gallery. Current save schemas stay unchanged, including existing four- and five-cabinet collections. The shell now navigates original dialogs with a controller and keeps mastery’s F power separate from choice 3 on touch. The full report records provenance, save architecture and the remaining live-device verification limits. [Release evidence](docs/memory-arcade.md).

Version 0.15.1 adds **First Endless**, the fifth Memory Arcade cabinet: the authentic v0.9.0 dungeon recovered from Git `73d7d9bce0683daf075fd706f6cbad6a75790cc7`. Clear the Cinder Regent in Sideways descent, then touch the violet terminal on the western floor of the Regent’s Furnace. Backtrack to the Threshold’s Arcade, read the cabinet, and Play. Clear the historical first five floors, including its floor-5 guardian, for one Archive token. Repeated clears cannot farm tokens; the old floor atlas and a fault pedestal join the collection. Original floor conditions, healing, enemies and score behavior are preserved, including BEST updating on death.

The old dungeon opens directly through its original entry API and resumes its own paused run. Its dictionary lives in `spark-substrate-legacy-first-endless-v1`; the identically named inner `spark-substrate-endless-v1` never reaches the current dungeon save. The outer shell provides power, dash, vessels and all three choice keys on touch, plus controller menu navigation and the same Return / ESC / View behavior. The room, trophy shelf and sealed machine now adapt to five cabinets. Existing four-token collections retain their discoveries, tokens and First light preference. Historical payload packaging is reproducible without temporary directory names in compiled source comments.

Verification for v0.15.1: 287 tests; all five genuine historical objectives at normal health; a normal-health route to the Cinder Regent, terminal discovery, earned backtrack to the Arcade, genuine v0.9 floor-5 clear, reward, exit, reset and reload; and the built Worker’s asset, D1 co-op/revive and save checks. Two production Canvas scenes cover the new cabinet and five-trophy gallery. Legacy assets remain lazy. The same live browser, physical controller/mobile, audio and browser-memory verification limits remain. [Full provenance and release evidence](docs/memory-arcade.md).

Version 0.15.0 · **memory arcade** preserves four actual earlier incarnations as playable artifacts. In Sideways descent, walk east through the Threshold, past the merchant, Vault and Memory Imprint altar. Press E / RT / GATE at the CRT doorway at x1210 to enter **The Memory Arcade**. This is a physical annex, not a title-screen Extras menu. The current body, injuries, room and clock wait at its doorway.

Echo Lives v0.1.0 is available on the first visit. Find terminals in the cleared Glass Causeway, the cleared Machine Sepulcher as Computer, and the cleared Mirror Nursery to awaken First Descent v0.2.0, First Duel v0.12.1 and First Sideways v0.13.0. Each cabinet has its original controls, a source receipt, a real objective, and an isolated saved game. Four frozen historical engines and their original art are recovered from exact Git commits. The broken v0.12.0 start page is not represented as playable; First Duel uses the genuine subsequent v0.12.1 repair.

Complete a cabinet once to remember an **Archive token**. The first token unlocks the optional amber **First light** side trail. Tokens are a collection record, not coins or essence. Awake screens, pedestal glyphs and trophy shelves record discoveries and completions. A sound terminal replays four original v0.2 synthesized effects; the gallery shows discovered original atlases. **The Unwritten** remains sealed, explicitly recorded as a fictional future hook with no attached game and no Play button.

Legacy HTML is lazy-loaded only when Play is pressed, inside a scripts-only opaque sandbox with no network transport. An authenticated per-launch message bridge holds each old save in `spark-substrate-legacy-<cabinet>-v1`; the collection uses `spark-substrate-memory-arcade-v1`. Current save schemas and rewards are unchanged. ESC, controller View, and a persistent Return button save and dispose the old runtime. There is one legacy iframe at a time. Cabinet reset touches only that cabinet; current New Save does not erase the optional archive collection. See [Memory Arcade implementation and provenance](docs/memory-arcade.md) for exact commits, discovery locations, storage boundaries and release evidence.

Verification for v0.15.0: 282 engine/DOM-harness tests, normal-health objectives in all four actual frozen games, and the complete current Sideways discovery → cabinet → completion → reward → return → reload flow. The existing 27-room Sideways route passes. The built Worker checks cover archive assets/provenance/CSP headers and existing D1 co-op, held-E revival, profiles and campaign snapshots. Four production Canvas room scenes were inspected. New current arcade code and CSS total about 45 KB uncompressed; legacy payloads load on launch and old art loads in the optional gallery. Physical-browser console, mobile/gamepad use, browser memory/FPS and audible quality remain live-playtest work; native Canvas renders and DOM tests do not establish those measurements.

Version 0.14.0 · **physical memories** builds the Sideways combat and economy in the existing game. Choose your input profile, then **Sideways descent**. Descent’s graphics stay unchanged; its campaign, daily, endless, rematches, Duel and online co-op remain separate.

Hits now have short hit-stop, buffered inputs, impact sparks, directional reactions, stagger, heavy knockdown, launch, one ground/wall bounce, death tumbles, small heavy-hit shake, hit sounds, and optional controller rumble. A vulnerable construct can be grabbed, struck, then thrown through a crowd. Authored casks can be lifted or broken; Rock lifts fault stones and makes wider, heavier throws. Corpses return to the floor without gore.

Enemy and guardian coins scatter, bounce, then magnetize nearby. Collect them and visit the **Threshold’s physical Vault at x710** with E / RT / GATE. Deposits reach the existing device Substrate coin bank; a saved outbox and per-journey deposit serial prevent a retry from paying twice. No essence, mastery, campaign key, or campaign seal is granted. Recovered wealth and owned alcoves appear in the room. Open the same existing alcoves here or on the start page.

The **Human scavenger at x450** sells carried-coin equipment, enhancement, food and a borrowed vessel technique. Later safe rooms contain a Tideglass offering, Root counter, Clockwork dispenser, Night gatherer and Dock trader, each with useful world-specific food. Food lasts 90 active seconds; equipment and borrowed techniques last until an actual fall. A fall loses a quarter of carried coins; banked coins, keys, memories, learned techniques and defeated guardians remain. Returning to a checkpoint from Pause preserves the current body’s build.

The **Memory Imprint altar at x1015** spends earned lasting memories and requires a remembered room. Coins can rent a technique for one body; they cannot permanently teach it. Old schema-1 saves receive memory credit for already-collected fragments and defeated guardians. The six imprints are:

| Vessel | Memory Imprint | Input / result |
| --- | --- | --- |
| Spark | Pulse return | Dash + Strike reflects nearby bolts. |
| Human | Held answer | A well-timed Guard counters contact; held Guard reduces damage. |
| Computer | Split current | Heavy fires three prism lanes; a dash strike briefly quickens fire. |
| Animal | Falling feral | Down + Heavy in the air dives into a landing strike. |
| Tree | Root lift | Rooting light strikes and longer launching reach. |
| Rock | Fault rebound | Heavy launches into a bounce; throws spread through a wider crowd. |

Sideways PC additions are **Up + K launcher, L grab/throw, G Human guard**. Controller adds **Up + Y launcher, LT grab/throw, L3 Human guard**. Mobile has GRAB and GUARD alongside existing actions. The original Descent controls and remaps are unchanged. Machine Sepulcher is the **one shallow depth-lane prototype**: Up/Down shifts floor depth; Space / A / JUMP still jumps. Collision, bolts, grabs and throws respect the lane; leaving resets depth and restores normal platform traversal.

At a cleared ordinary chamber’s glyph, **Pause → Remember this encounter** replays its constructs. It works on existing cleared saves, pays each construct only once per life, and repeats no key, seal or lasting memory. Clockwork Collectors include a captain with a breakable shell and longer warned lunge; Cinder Archons fire paired warned bolts. World faction cues use the existing constructs. Side-only Canvas layers add haze, parallax, foregrounds, masonry, dash traces and clearer attack follow-through. Existing art is reused; no new rendering dependency or atlas is downloaded.

Save compatibility: the storage key stays `spark-substrate-sideways-v1`; the payload is now schema 2, with explicit schema-1 migration. Injuries, room, keys, seals, forms, memories and clears remain; coins, broken props, builds, imprints and replay state are now saved too. A second active Sideways tab pauses the older one; unchanged older keepsake saves do not overwrite a newer deposit. Shared reward callbacks refresh unchanged device state before modifying it.

Changed systems: `sideways-engine.js`, `sideways-view.js`, new `sideways-brawler.js`, `sideways-build.js`, `sideways-scenery.js`, Sideways HTML/CSS and its narrow `descent.js` callbacks; `substrate-rewards.js` adds deposit serials. Descent enemy logic, online transport, server room schema, guardian tuning, Duel frame data and campaign save schema are untouched.

Verification: 265 engine/DOM-harness tests; the normal-health 27-room route with all eight guardians, seven keys, six vessels, jumped Feather and both directions of its seam; a no-injected-rewards economy walk from real Glass combat and two jumped memory ledges through equipment, a learned imprint, deposit, Surge purchase and reload; the built Worker’s module graph, assets, D1 co-op and revive checks; nine production Canvas scenes across all seven worlds inspected. Browser, physical gamepad, rumble, mobile layout and live side-combat balance still need live playtesting. Canvas rendering is bounded to 120 debris particles and 40 physical coin objects per room; extra drops consolidate without losing coin value. Native render timing is evidence for implementation cost, not a browser FPS claim.

Unfinished: Sideways remains solo; its platform/lane state does not use Descent’s top-down co-op protocol. No new online side mode, full faction hierarchy, advanced air recovery, independent per-world guardian kits, or shader overhaul is claimed. The strongest next rung is a dedicated host-authoritative **two-player Sideways slice in Glass Causeway and Machine Sepulcher**, covering synchronized launch/grab/root/throw, lane movement, revive and one shared coin receipt before extending through all worlds.

Version 0.13.0 adds **Sideways descent**, a separate solo side-scrolling adventure on the existing start page. Choose PC, Controller, or Mobile, then Sideways descent. Continue restores this mode’s exact room and injuries; Pause offers Map & journal, vessels, a return to the checkpoint, and Save & return. New side journey replaces only this mode’s save, `spark-substrate-sideways-v1`.

Twenty-seven connected side-view rooms span the existing seven worlds. The Cantor, Warden, and six later guardians have warned volleys and floor marks. Find seven canonical keys, return to junctions, and clear the Mirror Nursery to borrow all six bodies. Tree, Rock, Computer, Animal, Spark, and Human each open their existing kinds of passages. Memory fragments on ledges raise health and attack strength; remembered guardian seals strengthen this journey’s weapons. Rest rooms heal and remember a checkpoint on arrival; E at any cleared room’s glowing glyph restores health and changes the return point. Falling keeps collected objects and cleared rooms.

Animal can jump again in the air and Pounce into a landing strike; Spark drifts while Jump is held; Computer air-dashes and Overclock increases attack speed for four seconds; Tree’s Root hold grows a temporary step; Rock’s Fault guard protects a heavy shockwave; Human’s Rally restores health. Injury and power cooldown carry across morphs. Backtrack to the high Feather in Nacre’s Reliquary as Animal. After the Cinder Regent falls, it opens a two-way seam between the Mirror Nursery and Prism Night, with a one-time health-capacity reward. This path does not open the descent campaign’s Prism Night.

| Sideways profile | Controls |
| --- | --- |
| PC | A/D or arrows move; Space / W / Up jumps; Down + Jump drops through ledges; Shift dashes; J strike, K heavy, F power, E door / glyph, Q vessels, M map, Esc pause. Up / Down aims lumen or prism shots diagonally. |
| Controller | Stick / D-pad move and aim; A jump, B dash, X strike, Y heavy, LB power, RB vessels, RT door / glyph, View map, Start pause. |
| Mobile | Stick moves and aims; JUMP, STRIKE, HEAVY, DASH, POWER, GATE, VESSELS. Stick down plus JUMP drops through a ledge. |

At its v0.13.0 release, the mode used the Duel body and pose atlases, existing world backgrounds and guardians, a scrolling camera, parallax, readable shot trails, contact warnings, and impact sparks. It shares audio and motion settings and the start-page input profile. Its items, keys, seals, checkpoint, and completion belong to its own save; that initial build granted no campaign currency, mastery, keys, seals, or vault rewards. The descent, co-op, daily, endless, Duel, vault, binder, and Table retain their saves and controls. `window.SparkSideways` and four bounded WebMCP actions expose ordinary player actions for testers; `window.SparkDescent` remains available.

Verification for v0.13.0: 239 engine and DOM-harness tests, the complete 27-room path using real movement/combat/E inputs and normal health with checkpoint healing, save/reload between rooms, the high Animal-jump Feather and both directions of its shortcut, and the built Worker’s two-client D1 co-op checks. Seven production Sideways canvas scenes were rendered and inspected. Physical browser, gamepad, and mobile testing remains for live playtest; no browser-console claim is inferred from the harness.

The v0.12.8 Duel rung adds LP, HP, LK and HK, plus 27 directional techniques translated from the existing nine fighters. Confirmed hits can chain into stronger attacks, a ready technique and a full-meter Super. Damage scales with chain length; missed and blocked normals cannot cancel, repeated normals cannot restart themselves, and launch loops are bounded. Techniques share the existing power cooldown. The single power button, hold-back block, throw/tech, Focus, 100-meter Super, first-to-two rounds, local versus, bots and twelve-rung ladder remain.

Duel now uses separate punch and kick/lower-strike poses for all nine bodies, six painted versions of the existing stages, grounded shadows, smoother pose transitions, attack trails, impact sparks and a visible hit/damage counter. Move lists sit below each roster and in the paused Moves panel; numeric frame data remains behind hold-to-inspect. Descent controls and existing campaign, co-op, daily, endless, vault and Table saves retain their keys and behavior.

Verification: 222 tests passed, including all 27 command techniques, both facing directions, four-hit chains, low/overhead guard rules, confirmed Super cancels, short taps during hit-stop, PC/pad/touch maps, paused move guidance and campaign save isolation. Twenty-seven fighter/difficulty matches and local Human-versus-Spark finished with default health and real inputs; all twelve ladder matchups finished. Six ordinary-health endless simulations still reach the first dozen floors and resume a checkpoint. Six production canvas scenes were rendered with the native Canvas runtime and inspected. Physical browser, controller and touch play remain unverified.

The v0.12.7 rescue patch preserves held E across world polls and reads the latest authenticated hold independently of buffered movement ticks. An explicit release, lost focus, or leaving the circle cancels channeling; a stale relay holds the clock and combat until a fresh update. The rescue circle and contact radius are both 110 units. Progress appears as REKINDLING, a percentage arc, and reviving player status. While holding E near a fallen partner, guest rendering shows the authoritative position rather than a potentially misleading unacknowledged movement preview.

Every lethal co-op fall has a serial acknowledged by the guest. The host holds the rescue clock and combat until the guest receives that fall; an input relay older than 1.2 seconds holds them again. A bounded guest rescue poll can deliver current snapshots independently of a stalled ordinary request; older replies cannot roll the fallen state back. Both-down ends immediately. Rescue expiry at 30 active seconds ends the entire shared life, including a surviving partner; results now state that cause. Killing the final swarm enemy waits for rescue before chamber/story progression.

Room → Revive playtest offers Controlled fall · host / guest, enabled for the host only when both sparks are alive in a quiet cleared chamber (including The Threshold). These buttons cause real lethal damage in the current co-op life; they grant no rewards or healing. The room text states the expiry consequence. Leaving co-op returns to the start screen. The next-life Swarm pact choice survives navigation and reload and is applied when the host creates the life.

Duel contact now matches the wide side-view bodies and resolves during walking and hit freeze, without requiring an attack. Close attack and throw reach and bot spacing use the new contact size; frame timing is unchanged. The meter reads / 100 and instructions state that Super requires full meter. Quick taps are tested on both keyboard maps.

Verification: 208 tests pass, including both clients rekindling actual lethal falls with 600–750 ms delivery gaps, three seconds waiting for a fallen-state acknowledgement, a stalled pre-fall snapshot, visible ring contact, release, final-swarm ordering, pact reload and simultaneous keyboard walking. The built Worker repeats the delayed rescue check with real D1. Physical two-device Internet rescue and visual checks still require the testers' live recheck; VM tests are not a browser-console check.

The v0.12.6 playtest patch fixes lethal-damage co-op revival: fallen sparks stay at zero HP, have a 30-second rescue window, and can be rekindled by a nearby partner holding E for 1.8 seconds. A second fall or an expired rescue ends the life. Regeneration and story gifts cannot silently revive a fallen actor. Both screens show the countdown and hold progress.

Partner votes use an independent authenticated host pulse and monotonic vote revisions so an older world response cannot erase them. Movement status has a short activity grace; gate contact accepts 120 pixels, arrivals are offset from the return gate with a brief latch, and the first entry into each hostile co-op chamber restores up to 12% maximum HP. Same-device co-op players use separate progress credentials and personal save profiles, with the original `spark-substrate-descent-v2` campaign retained and selectable on the start page. Expired resume is quiet and cannot overwrite a newly opened room.

Paid Vault seals deduct their exact displayed cost, without discovery or duplicate coin rebates; unaffordable seals are visibly dimmed. Collector and Archon still unlock when met, as specified; their remaining Vault seals reveal memories. Duel prevents merged ground bodies, buffers short attack taps, counts supers in power statistics, clips defeated bodies to the floor, and displays both keyboard maps for local versus. Foreground slow-frame elapsed time is retained in both descent and Duel rather than discarded. Chamber rewards require a new clear, and queued gifts identify the cleared room. Inactive mode canvases are hidden and inert.

Verification uses engine tests, two UI clients connected to the room API, and the built Worker with D1. Physical two-device rescue, real second-keyboard play, and visual/performance checks remain live playtest checks; no browser-console claim is made from VM tests.

Version 0.12.8 · vault and table · duel techniques keeps the dedicated start page and remembered PC, Controller, or Mobile profile. The playtest fixes landed before the new systems: rematch losses report guardian HP and percent, returning restores the launch chamber, Feather contact is larger, a saved floor-seven checkpoint offers floor eight, and checkpoint recovery names Living Vessel healing separately. Map legends, gate seals and prompts stay inside their containers; the live HUD shows stratum progress. Cantor tuning is unchanged.

The v0.12.1 hotfix repairs the start-page crash reported by Maverick: settings now writes profile hints into their own child span, preserving the fire label, and fire controls tolerate missing optional elements. PC, Controller and Mobile enable all start modes and survive reload. Host room is visible beside Join room. Select Host room, choose a body, create the room, and share its eight-character code; the other player uses Join room. Existing save data is retained.

The v0.12.2 co-op hotfix binds the default browser fetch transport to its global receiver, repairing Illegal invocation during room creation. Setup explains an unfinished life before body selection, disables create/join until it ends, and offers Return to my current life. Leaving when no room exists is a harmless no-op. Leave current room is shown only for an active room. Spark is preferred when present in the host's three karma offers; otherwise the picker explains its eligible default. Joining defaults to Spark and permits all six vessels. Connecting disables setup controls, and failures are shown once in the dialog. No save reset is required.

The v0.12.3 co-op patch catches up to persisted host and guest sequence counters, releases stale input after a throttled frame loop or lost focus, and pumps live snapshots from both the timer and the animation loop. Reloading preserves the existing room credentials and campaign state, with neutral guest input and the host's pause respected. Both vessels show player, body, and local/partner labels from the Threshold onward. The room strip and mobile arena show idle, away, paused, delayed, disconnected or reconnecting partner status. `SparkDescent.observe().coop` reports packet sequences, update age and round-trip time without exposing credentials. Near-gate prompts explain when the partner must approach or be revived; the ordinary destination no longer replaces that message. Native dialog close restores arena focus and cannot reapply a setup pause after creating a room. Setup keeps body options consistent with its hint and shows the connected players instead of recomputing next-life offers. Lobby instructions name Join room. All browser modules and the entry stylesheet use the v0.12.3 asset version, with revalidation headers and guarded profile/fire labels, to prevent stale entry scripts from mixing with new HTML.

The v0.12.5 co-op hotfix replaces arrival-timed guest movement with fixed-duration, numbered input ticks. Cumulative batches retry until acknowledged; the host consumes each tick once, and guest drawing replays unacknowledged ticks using the same movement and collision rules. A small authenticated input route runs independently of full world snapshots, with at most two input requests in flight and a four-second history bound. Focus loss, room transitions, and choices cancel queued controls. Combat, gates, rewards, and saves remain host-authoritative. Both clients must reload for this protocol; legacy held-input clients remain accepted.

Guest Map and Room dialogs are local and neutralize guest controls. Co-op focus loss does not pause the other player; explicit host Pause still pauses both. Visible feedback explains Q during a gift or story choice, including controller input. The active Room picker shows the current vessel. Movement status uses observed motion with a brief grace period, and connection warnings allow a longer relay window. Story votes are atomically scoped to choice identity rather than host heartbeat sequence, including away guests; host confirmation remains required. Out-of-range E gives a gate proximity message. Names, votes, and input acknowledgements stay outside campaign progress. The complete browser asset graph uses v0.12.5.

Auto-fire remains the default. Manual fire uses held left click or J, controller RT, or the separate mobile FIRE button. The vault unlocks Surge: auto-fire plus a manual volley on a four-second cooldown. Swarm pact applies denser encounters and fragment attraction to a campaign life; ordinary campaign density stays unchanged. Endless shares the denser, telegraphed shooter patterns. All modes use the existing vessels, enemies, guardians and worlds. The body falls. The spark remembers.

Endless Dungeon adds seeded floors without a final floor, rising enemy health and damage, rotating conditions, a guardian every fifth floor, all six starting vessels and immediate resonance. Its save and best-floor record stay separate from campaign rewards. A twelve-rung solo duel ladder adds named rivals, changing conditions, stronger bots and visible opponent health bonuses.

Every realm has eighteen connected rooms, including the Uncreated: 126 total. Later worlds increase enemy health, damage, movement, swarm size and active pressure gradually. Local ward chambers lengthen the route to guardians; players who already earned a world’s seal keep their old guardian access. Twelve obstacle arrangements, including distinct Nursery, Reliquary and endless floor-seven cover, open floors, two resting places per later world, warning-circle rooms, vessel shortcuts, optional side paths and authored arrival stories give the routes different rhythms.

A separate local 1v1 duel uses side-view bodies for the six vessels, plus met Collector and Archon fighters and Cantor earned by winning its rematch. Six existing stages, manual attacks, hold-back block, throws and breaks, powers, Focus, meter, supers, first-to-two rounds, a skippable floor-glyph return, and three bot difficulties share the same frame-data shape. Its records and rewards are separate from campaign progression. Seven realms, 126 chambers, eight keys, six seals, eighteen skill paths, equipment, karma endings, daily seeds, online co-op, and Echo Lives are preserved. No new vessel, world, god or ending is added.

## Play

Choose a profile and fire mode on the start page, then Begin descent, Continue, Daily descent, Host room, Join room, Duel, Endless Dungeon, Vault, Binder, The Table, or Sideways descent. Settings can change the profile and fire mode later. Continue appears only when a saved journey exists. PC and Controller hide the touch stick; Mobile keeps it available during live play and recommends landscape. Sound is a visible opt-in.

Move with WASD/arrows; Space dashes; F activates the current vessel’s power; E uses a gate; M opens the world map; Escape pauses. Auto weapons fire at the current attack speed; Manual uses held left click or J. Gifts that change attack speed apply to both. Press 1–3 to choose bodies or battle gifts. For story responses, 1–3 highlight an option and Enter confirms it. Clicking or tapping a story card still chooses it directly. Clicking anywhere on a body card starts a run; Space inhabits the focused card or first offered body. Touch controls include a stick, DASH, POWER, MORPH, GATE, and a FIRE button away from the stick.

After learning Vessel Resonance, press Q to open six vessels, then 1–6 or a card to morph. Morphing preserves injuries, equipment, gifts, and the active-power cooldown. Resonance itself recovers in three seconds. Native traversal abilities continue to distinguish Computer, Tree, and Rock. Fallen co-op vessels need revival before morphing.

| Vessel | F power | Cooldown |
| --- | --- | --- |
| Spark | Lumen pulse clears nearby enemy bolts and damages nearby foes | 8 seconds |
| Human | Rally heals up to 18 HP, guards for three seconds, and strikes nearby foes | 12 seconds |
| Computer | Overclock doubles attack speed for four seconds and launches a seeking volley | 10 seconds |
| Animal | Pounce leaps along the facing direction and strikes at the landing | 6 seconds |
| Tree | Root hold roots nearby foes and heals up to 12 HP | 10 seconds |
| Rock | Fault guard guards for four seconds and creates a heavy shockwave | 11 seconds |

In co-op, hold E beside a fallen partner for 1.8 seconds to revive them. Both living vessels must approach gates together. The host chooses shared gifts, story decisions, checkpoint travel, and equipment; both players can morph and use powers independently. Release E after crossing a gate before crossing again.

## Local duels

Choose any available pair of Spark, Human, Computer, Animal, Tree, Rock, Collector, Archon, and Cantor. Collector and Archon unlock when encountered; Cantor requires a rematch win. Sealed roster cards identify where to meet them. Stages are Threshold Glass, Tideglass, Root, Basalt, Night, and Orbit; their parallax scenery has no gameplay differences. Cards show epithet and power; frame data appears only while holding Inspect.

| Input | Player one | Player two |
| --- | --- | --- |
| PC | WASD move/jump/crouch; F LP, G HP, C LK, B HK, H launcher; R power, T Super; hold V Focus | Arrows move/jump/crouch; K LP, L HP, comma LK, period HK, ; launcher; O power, P Super; hold I Focus |
| Controller | Stick/D-pad: up jumps, down crouches; X LP, Y HP, A LK, B HK; LB launcher, RB power, RT Super, hold LT Focus, Start pause | Second standard pad, or player-two keyboard controls |
| Mobile | Shared stick: up jumps, down crouches; LP, HP, LK, HK, LAUNCH, POWER, SUPER, held FOCUS | Pass-and-play: three seconds of action per turn, with a ready gate freezing the stage and clock between turns |

Hold back to block; crouch-back guards LK and low techniques, while standing-back guards overhead HK. Normals do no chip; blocked specials do 5%. Close LP+back throws; the same input within eight frames breaks the throw. In Classic, each power recovers in five seconds. Hits and damage taken build meter. At full meter, a super spends it even on a whiff and uses a 1.2-second resonance cinematic. Normal hits freeze three frames; counter hits freeze six.

Each fighter has three original technique names and effects. Forward/back are relative to the opponent. Enter the two directions within 24 frames (0.4 seconds), then the shown attack within ten frames:

| Motion | Button | Technique family |
| --- | --- | --- |
| Forward → down | LP | Trace: lumen/prism/root/fault travel, a guarded step, pounce, collection lunge or Cantor ring |
| Down → back | LK | Bind: a short vessel guard with a near pulse, root hold or low sweep |
| Back → forward | HK | Break: a rising vessel strike that lifts the opponent |

The paused Moves guide gives each vessel's name and rule. For example, Human has Rally step, Glass oath and Heart against the pattern; Tree has Root passage, Living vessel and Archive rising. A hit-confirm chain follows LP → LK → HP → HK/launcher → a ready special → full-meter Super. Each next normal must be stronger; blocking/whiffing prevents cancels. Damage scales by 14 percentage points per continuing hit down to a 50% floor. Native power and all three techniques share the existing five-second cooldown (three in Quickening). Input taps survive hit-stop; pause, blur, profile changes and mobile handoff clear pending motions/actions. Medium/Hard bots enter command directions through the same parser and use their own confirmed attacks to chain.

Hold Focus for 0.4 seconds to earn a short guard-point and faster special. A whiff costs ten meter. Collector translates its lunge and grab, Archon launches an aimed bolt, and Cantor uses its wind-up ring. These remain original substrate kits.

A round ends at zero HP or the 60-second clock, awarding the higher health percentage. A tie replays once without a point; a second tie proceeds to a new round. Rounds have a two-second break without menus. The first fighter to two wins finishes the match. Only a match-winning round with the loser below 10% and the winner holding meter gets the two-second substrate seal; its button skips it. Pause offers resume, rematch, character select, and quit. Losing bodies fall and release a spark, with no gore.

Easy, Medium, and Hard bots share the same kit. They observe position and visible poses, plus their own resources; they do not inspect future input or hidden opponent frame data. Hard blocks a special after seeing it once. Local duel records use `spark-substrate-duels-v1`; they award no campaign mastery, essence, keys, or seals. Local versus is the shipped PvP mode; Internet play remains the existing descent co-op.

## Endless dungeon and duel conditions

Endless Dungeon is solo. A new attempt starts with baseline gear, no campaign skill bonuses, and the selected vessel. All six vessels, their native powers, and Q resonance are available immediately. Changing vessel preserves health percentage. Each cleared floor restores the greater of 20% maximum health or 32 HP plus 2 HP per depth step, with that depth component capped at 60 HP. Withering refuge restores 60% of that amount, rounded up. Recovery is capped at vessel maximum health and the checkpoint reports actual healing and banks all remaining fragments. Earned gifts wait at the checkpoint before descending; they do not interrupt live dungeon combat. The next floor, condition and enemy health multiplier are visible before entering.

Seeded layouts reuse the existing castle and world artwork with twelve deterministic obstacle arrangements and ten swarm chamber templates and eight repeating guardian encounters. There is no final floor or story ending. Enemy health grows by 11% of baseline per floor, damage by 3.5%, and spawning becomes faster. Active enemies cap at eighteen and swarm totals at seventy-six to bound simulation work; health and damage keep rising. Ember, Wayfarer, Bellkeeper, Seamwalker, Archonbreaker and Unbound rungs mark each five-floor band, with continuing numbered Unbound ranks. Returning to start saves the exact dungeon build and restores the campaign. `spark-substrate-endless-v1` stores the device-only dungeon save, completed attempts and best cleared floors. BEST updates and saves immediately at every checkpoint; the live HUD shows current floor and best completed depth. Dungeon-specific arena names appear in the header, canvas, checkpoint forecast and floor map. Death results lead with the floor reached and also show completed floors. Guardians start at 3,600 HP before the floor health multiplier and gain another factor of `1 + (floor - 5) / 30` on later guardian floors; their damage is 1.4 times the ordinary floor damage. Current saved encounters keep their stored health, and later floors use the new tuning. Campaign D1 and co-op APIs reject dungeon snapshots.

Dungeon conditions: Unbroken current has standard rules; Fleet echoes adds 12% enemy speed; Crowded lattice adds six enemies and two active slots; Fault weather marks circles for 1.5 seconds before a strike every eight seconds; Withering refuge reduces cleared-floor recovery.

| Duel condition | Rule applied to both fighters |
| --- | --- |
| Classic | 100 HP, standard movement, five-second power recovery |
| Glass oath | 80 HP |
| Quickening | Three-second power recovery |
| Heavy law | 20% slower movement and 25% stronger gravity |
| Charged current | 50 meter each round; two meter gained each second |
| Seal break | Vault unlock: the first hit of each round cannot be blocked |

The twelve-rung solo ladder uses the selected Player 1 vessel against a named bot. Early rungs use Easy, the middle uses Medium, and the final six use Hard. Each rung adds four visible opponent HP, up to +44; condition rules still apply to both. A loss keeps the rung, a win saves the next, and the champion can restart the climb while retaining the best result. `spark-substrate-duel-ladder-v1` is separate from the campaign and ordinary duel record. Mobile ladder controls stay with Player 1 against the bot; ordinary Mobile versus remains pass-and-play. HUD counter-hit and throw-break cues and match damage/power statistics show the result of play. These are local/device records, with no online PvP ranking.

## Vault, cards and The Table

Substrate coins are separate from essence and mastery. First chamber clears and endless floors grant two coins (guardian floors three); a duel win grants three, with two more for a ladder rung. A duel loss grants zero. New cards grant one discovery coin; repeat finds grant two. Receipt and visit records prevent repeated rewards on reload, and each visit permits at most one card find.

The start-page vault is a ring of nine seal alcoves, ordered Surge, Seal break, Collector, Archon, gold spark trail, Glass at dusk palette, SIX’s Question, Aster’s Shelter, and Morrow’s Patience. Each shows cost, owned state and encounter requirement. Purchases are deterministic, with no timers, random paid openings or real money. Meeting Collector and Archon already unlocks their fighters; their vault alcoves reveal encounter cards. Cantor remains a feat unlock.

The shared binder contains twelve found memories: First Player, Feather, Ivory Key, Second Movement, Living Vessel, Buried Circuit, Unbound Conduit, Glass Oath, Root Passage, Fault Breaker, Nacre’s Error, and The Uncreated. Each has one memory, one supported mode and one rule: a duel condition, Swarm pact modifier, Table boon or journal line. Binder access is available from start, pause and The Table. A card found in Glass Causeway is available at The Table. Cards never award campaign keys or seals.

The Table is a saved party session at one firelit table: the player, two different remembered vessels, and an optional met enemy guest after the second scene. Six scenes use existing room choices and guardian lore. Pick one of three responses, roll two six-sided sparks, and resolve Pulse, Root or Fault. Each six remembers; snake eyes falls. Vessels shift these three numbers, and a Table card can be played once per session. The three vault boons add one to their respective stat for the session. A session ends after six scenes or twenty active minutes, writes a journal entry, and may award a card and a few coins. Leaving returns to start and saves the session. No chamber, campaign key, seal or Prism Night gate changes.

Keepsakes use `spark-substrate-keepsakes-v12`; the Table uses `spark-substrate-table-v1`. Both persist on this device separately from `spark-substrate-descent-v2`, campaign cloud saves, dungeon saves, duel records and the ladder.

## Seven realms

| World | Scene | Guardian | Keys |
| --- | --- | --- | --- |
| The First Stratum | The original eighteen-chamber substrate castle | The Warden | Ivory, Tide, Crown |
| Tideglass Expanse | Drowned towers and tidal stone | Thalassa, Tidekeeper | Pearl |
| Verdant Memory | Living roots around an abandoned command | The Thornmother | Seed |
| Cinder Clockworks | Furnaces and stopped clocks | The Cinder Regent | Ember |
| Prism Night | A province woven from discarded dreams | The Night Weaver | Dusk |
| Pale Orbit | Lunar bridges and stars without an outside | The Pale Curator | Orbit |
| The Uncreated | The origin seam beyond the six laws | The Demiurge | All six seals and a living Human at the final door |

After defeating the Warden and resolving its story and gifts, choose to finish the first descent or continue through the eastern Tideglass portal. Completing the first descent banks that life; continuing preserves the current build for the rest of the campaign. Each created-world guardian grants a seal that opens the next world. All six seals open the Uncreated. Its mega boss changes laws at two health thresholds, combining crown rings, aimed fans, ground warnings, and summoned constructs.

Guardian wards identify the chamber that must be cleared before their local key works. Existing world seals bypass that ward on returning saves. The First Stratum remains eighteen rooms with its original routes.

Keys are physical pickups: clear their chamber, make its story choice, then walk onto the glowing pedestal. They are never consumed. The original Ivory Key route runs east from the Quiet Array through the Unbound Conduit to Nacre’s Reliquary. It opens the Mirror Nursery and teaches Vessel Resonance. Tree, Computer, and Rock gates lead to the original Archive, Observatory, and Belfry branches. Later worlds add five distinct vessel trials and matching armor rewards.

From a safe world checkpoint or defeated guardian, use the map’s world tabs to travel to an unlocked world. Travel preserves injuries; co-op partners must stand close together. Full maps show room names and routes. The sidebar map uses one-word labels for discovered rooms, full names on hover or focus, clear stamps, and the current room’s full name below it. Unknown cells remain blank. The sidebar collapses during combat and expands for pause, gifts, maps, or its Expand control. Key and vessel legend icons use inline SVG.

Arrival chapters and aftermath choices for all 126 chambers continue the stories of Nacre, Iona, SIX, Aster, Morrow, and the nameless pack. The final confrontation asks whether creation can choose its own purpose. Journal entries and enemy discoveries are remembered between lives.

## Cross-world discoveries and rematches

Diamond-shaped route relics are physical pickups after combat and story resolution. Nacre’s Feather and the Mirror Nursery curiosity appear even in rooms already cleared on old saves. Unvisited discovery rooms in unlocked worlds have dotted map borders, source/destination hints and diamond or question-mark markers. Clues in the Reliquary, Foundry, Archive and Belfry are added to the journal on return visits as well as first arrivals. The HUD, journal, map and locked-gate prompt name their source and destination. They are separate from equipped relic gear, are not consumed, and remain between lives. All five paths are optional; none blocks campaign completion.

| Found item | Source | Opens in another world |
| --- | --- | --- |
| Nacre’s Feather | Nacre’s Reliquary, First Stratum | Door Behind Sleep, Prism Night |
| Salt Hourglass | Lantern Grave, Tideglass | Unburned Minute, Cinder Clockworks |
| Ember Moth Wing | Ash Lift, Cinder Clockworks | Unplayed Concert, Prism Night |
| Star Seed | Vacuum Garden, Pale Orbit | Ninth Bell, Verdant Memory |
| Unmade Thread | Room Without a Name, Uncreated | Outside Window, Pale Orbit |

Six question-mark curiosities use vessel-specific interactions: Spark finds a tiny player cursor in the Mirror Nursery, Computer supplies address 667, Rock rings a ninth bell, Human snoozes a factory clock, Tree listens to a silent concert, and Spark sees past the painted sky. The correct vessel awards one remembered journal entry and 6–15 essence. Repeated or held interaction cannot duplicate rewards. A co-op partner can collect route relics and investigate in its own form; both sparks remember the shared discoveries.

Guardian rematches unlock when a boss is encountered, including bosses remembered on old saves. Every attempt uses a fixed world practice level (`6 + 4 × world rank`), starter equipment, no learned mastery or permanent memories, and the selected vessel’s native weapon. Campaign levels, gifts and enhanced gear cannot change the challenge. The First Stratum practice Cantor and Sentinel have 4,000 HP; the Warden has 4,800. Later guardians scale health to their world. Echoes deal 1.25 times base damage and keep the campaign patterns, including visible wind-ups and phase changes. Their results grant no essence, equipment, keys, seals or mastery. Leaving practice restores the exact campaign run, including waiting gifts, and both D1 APIs reject echo snapshots. Practice can be restarted or left at any point through the start menu or the map’s return button. `window.SparkRematches` and two bounded WebMCP actions expose the same practice/return path.

The swarm display counts actual defeats and reports how many opponents remain, including summoned foes and unspawned waves. A full spawn budget never fills the bar while enemies survive. Bosses instead display remaining guardian health. Legacy room counters initialize from the stored swarm and live enemies; new rooms start exact counters.

## Skill trees and specialties

Each vessel has three linked paths: a foundation costs one mastery point, and its specialty costs two more. Learn any foundations, but choose only one specialty per vessel. Five earned points allow three foundations and one specialty. Rebuilding returns all spent points, keeps mastery, and is free between lives.

| Vessel | Specialties |
| --- | --- |
| Spark | Beacon, Slipstream, Afterglow |
| Human | Duelist, Warden, Mender |
| Computer | Oracle, Clocksmith, Firewall |
| Animal | Hunter, Windrunner, Packheart |
| Tree | Ancient, Thornheart, Grovekeeper |
| Rock | Earthbreaker, Bastion, Rolling Stone |

Clear a combat chamber for ten mastery, or a guardian chamber for thirty. Each twenty mastery earns a point, capped at five per vessel. Credit goes to the body each player spent the most combat time inhabiting in that chamber. Safe checkpoints and repeated cleared rooms grant no mastery. Mastery is banked when a campaign life ends.

Learned trees are snapshotted at the start of a life; morphing activates the new body’s learned effects. Health bonuses change the maximum while preserving the injury percentage. Power cooldowns continue through morphs. Tree upgrades affect actual attack reach, damage, movement, recovery, armor, projectiles, rooting, powers, or partner healing. The power description reflects upgraded healing and durations.

Co-op uses the host’s learned trees for the shared build. Host and guest bank their own vessel practice and damage statistics. Leaving a guest slot clears that player’s counters before a new guest joins, while temporary disconnections retain them.

Existing pre-mastery saves grant one welcome point to each previously recorded vessel, exactly once. No previous essence, keys, equipment, or abilities are spent. Old active runs begin tracking mastery and detailed damage as play resumes.

## Endings, records, and daily runs

Both the Eye and Demiurge offer stage-specific versions of three endings: The Open Hand at karma +25 or higher, The New Crown at −25 or lower, and The Remembered World between those thresholds. The Eye’s milestone waits for a keyboard/controller decision: continue the campaign or complete the shorter descent. Full victory still requires the final Demiurge.

Every completed life records its build, personal damage dealt/taken, powers, dashes, chambers, kills, level, time, seed, and earned vessel mastery. Damage counts actual health removed, with correct projectile attribution after morphing. Last run and best chamber performance persist. Save run card renders a 1080×1080 PNG for download; it does not post to a social service.

Daily descent starts everyone as a baseline Spark with the same UTC-date seed, starter gear, and no permanent skills or upgrades. The seed controls enemy placement and gift randomness; movement and choices affect the resulting sequence. Found gear remains usable during that daily life. Daily results are stored separately for up to fourteen dates and grant no campaign essence, mastery, keys, or equipment. There is no online leaderboard.

## Sound and personal controls

Enable sound for distinct hit, defeat, damage, power, level-up, gate, and victory cues, plus a quiet ambient drone. Web Audio creates these sounds locally. Sound begins through a player gesture and preferences persist on the device.

Settings provide master, effects, and ambient volume, screen-shake strength, flash intensity, input profile, damage numbers (off by default), and quick shake-off/low and reduced-flash presets. Shake is brief and bounded; the HUD remains still. Zero flash intensity removes nonessential blinking and brightness flashes; damage numbers remain an independent option. System reduced-motion preferences also suppress shake and nonessential flashes.

Keyboard bindings can be changed for movement, dash, powers, gates, vessels, map, and pause. Bindings are unique; arrows and number keys 1–6 remain available. Controls and power hints reflect saved bindings.

Standard-mapped controllers use the left stick/D-pad for movement, A for dash/confirm, X for powers, B for gate/revive/back, Y for vessels, LB for map, and Start for pause. D-pad selects menu buttons and A confirms. Action pulses require release before repeating; gate/revive may be held. Touch controls remain available and the settings explain the landscape layout.

The first life initially shows movement, health, fragments, and the map. Karma, currency, equipment, and co-op appear after the first story decision; powers and gifts appear as they become relevant. Skill trees and daily challenges appear after recorded progress.

## Equipment and lasting progress

Carry a relic, ward, weapon, and armor. Six original relics/wards remain. The twelve new items form these sets:

| Set | Weapon | Armor | Pair bonus |
| --- | --- | --- | --- |
| Tidebound | Tideblade | Coral Mail | Regeneration and attack speed |
| Living Grove | Thorn Staff | Grove Mantle | Maximum health and regeneration |
| Cinder Crown | Cinder Maul | Furnace Plate | Damage and damage reduction |
| Night Hunter | Night Fangs | Veil Garb | Movement and dash recovery |
| Pale Horizon | Orbit Prism | Astral Aegis | Weapon reach and attack speed |
| Before the Law | First Light | Dawn Shell | Damage and regeneration |

Weapons change actual attack patterns: sweeping blades, radial waves, prism volleys, or seeking bolts. Vessel powers remain tied to the inhabited body. Matching armor adds the pair bonus; mixed sets retain each item’s individual effects.

Found gear can be equipped at safe checkpoints during a run, preserving both players’ health percentages. Items enter permanent inventory when that life is recorded. Enhance items between lives to +3 for 3, 5, and 7 essence. Enhancements and loadouts persist; checkpoint equipment changes become the next-life loadout.

Keys, seals, discovered abilities, map rooms, equipment, journal, and bestiary survive recorded reincarnation. Karma shapes the next three offered vessels. The first lasting health or attack-speed memory costs 4 essence, and a first life with at least one defeated construct earns at least 4.

## Refinements and new saves

Machine Sepulcher now limits combat to fourteen enemies, five simultaneous enemies, and one ranged turret. Turrets telegraph their aim for 0.75 seconds before firing; Machine shots are slower, weaker, and less frequent. Collision sweeps movement in short steps, slides around pillars, and ejects overlapping bodies. The Quiet Array keeps its gentler eighteen-enemy, six-active encounter and adds violet echo circles with a 1.5-second warning every eight seconds. Tree moves at 200 instead of 185. The Reliquary now has four low plinths, the Nursery has four corner blocks, and the Cistern has two broad reservoir edges; all retain clear gate and pickup lanes. Machine collision and its gentle encounter are preserved. The Cantor previews each volley for 0.9 seconds, changes from six radial bolts to eight bolts plus an aimed pair below half health, and shows a named defeated/reward panel. Boss fights bank gifts until the cleared-room story choice; the clock continues past five minutes during active combat. Key and ability pickups show banners, expanding rings and dedicated sound cues. The journal marks collected keys, and maps distinguish waiting and collected keys. Every door carries a permanent destination label; nearby prompts name that same destination, direction and lock requirement. Campaign progress counts all 126 rooms, including 13 safe checkpoints; run summaries and cards explicitly label their 113-room combat statistic. Rematch headers identify the guardian’s world and show the fixed practice level instead of campaign progress. A deferred native dialog-close event cannot pause a fresh rematch or alter the restored campaign’s pause state. Gift/story pause labels explain stopped clocks, and single-chamber summaries use the singular. Normal chamber clears heal 12 HP; guardian clears heal 30 HP.

Damage flashes, rings, and floating numbers remain. Healing choices explicitly say “up to” their reward and explain the maximum-health cap. Story essence updates the header immediately. Keyboard controls suppress page scrolling, battle choices remain keyboard-selectable, pending choices survive paused reloads, and dialog footers remain outside their scrolling content.

Story number presses only highlight a choice, even when a story appears immediately after combat or a gift. Enter confirms the selected or deliberately Tab-focused card; Enter without a selection and held-key repeats do nothing. A restored story starts with no selection. Gifts retain their one-key selection, and pointer/controller card confirmation remains direct. A short chamber arrival delay now displays an approaching-swarm message and countdown before the first spawn without changing combat timing.

The version label stays separate from save feedback. Normal online backup transitions retain “Progress saved on this device”; the tooltip reports online backup state, while storage failures, retries, and conflicting tabs remain visible. Settings and other dialogs temporarily hide the underlying choice overlay, retain the choice and highlighted story option, and restore the previous paused state on close. Settings also explain when a choice is waiting.

New save opens a confirmation before starting the first-time introduction with starter equipment and no progress. It keeps one previous spark, including its private progress credential, for restoration through the same dialog. Leave co-op before changing saves. New saves create separate anonymous profiles; they do not erase the previous server profile. Disposed progress connections cannot replace a fresh save with a delayed response.

## Online co-op and saves

The published Site remains public. Host a fresh two-player run, share its eight-character room code, and have a second player join. Room codes pair players without changing the Site audience.

The host runs the authoritative 60 Hz simulation. Same-origin HTTPS room APIs relay snapshots and guest input, normally up to ten times per second. Powers and independent morphs follow that same input path. Guests render smoothed snapshots. Host pause or a disconnected partner pauses the current. Guests can inspect maps, vessels, and the journal independently.

Rooms expire after two hours. Reloading the same tab restores its temporary room credential; a returning host resumes manually. D1 stores rooms, with hashed credentials, sequence guards, atomic joins, and bounded expiry cleanup.

Progress uses an anonymous private credential retained by this browser, plus a local recovery copy. It is not account-based cross-device sync. Revision checks protect against competing tabs. Existing v0.3–v0.11 saves remain valid; training, practice, statistics, milestone, record, and daily fields are optional and no database migration is needed. Previously completed v0.5 lives retain the first guardian seal and gain Vessel Resonance. Cloud restoration never replaces an active co-op world.

Echo Lives retains its original device-local save, thirty-six events, 108 choices, six forms, reincarnation, and optional awakening ending.

## PixelForge / PhiCade runtime bridge

The canonical source now includes the first narrow **SPARK Runtime Bridge v1**
adapter for the real Descent engine. It starts a fixed-seed Spark in **The
Threshold** and exposes only bounded MOVE, DASH and PULSE actions through the
PixelForge Runtime Bridge v1 method surface. It does not read or write campaign,
Sideways, keepsake, Memory Arcade, legacy, co-op or server saves.

Run the focused proof with `npm run test:runtime-bridge` or
`npm run check:runtime-bridge`.

See [SPARK Runtime Bridge v1](docs/runtime-bridge-v1.md).

## Source and verification

The first canonical repository import is frozen in [SPARK v0.17.0 Canonical Architecture Baseline](docs/canonical-architecture-v0.17.0.md), including current runtime, save, Memory Arcade, online, PixelForge, PhiCade and future Unreal boundaries.

Static source and generated WebP atlases live under `public/`; image-generation prompts are under `art/`, `art-prompts-v12.md`, and `art-prompts-v128.json`. The v0.12.8 assets are `public/duel-strikes-v128.webp`, `public/duel-kicks-v128.webp` and `public/duel-stages-v128.webp`; the two 1254×1254 pose atlases retain generated transparency, and the six-stage atlas is 1672×941. Format conversion used lossless WebP for the poses and quality 92 WebP for stages; no raster repainting was performed. Floor and boss atlases use six cells, equipment twelve, and `duel-fighters-v12.webp` nine side-view bodies in a transparent three-by-three atlas. Reduced-motion preferences suppress nonessential effects.

The Vinext starter provides the Worker and Sites build plugin. `build/sites-worker.ts` dispatches the room/progress APIs to `server/`. `.openai/hosting.json` retains the original project ID and D1 binding `DB`. Existing Drizzle migrations remain immutable.

Use Node >=22.13 and the locked pnpm setup:

- `node --test tests/*.test.mjs`: 222 tests covering the start-page DOM-removal regression, three profiles and reload, every primary mode's entry and co-op host setup; the default fetch receiver, unfinished-life warning and preservation, host eligibility and Spark preference, busy controls and single setup errors; the Phase 1 playtest fixes; Manual/Surge attack speed and input; pact density; Focus, earned fighters and the floor-glyph finisher; separate coin purchases and shared cards; saved Table sessions and cross-mode isolation; and the existing campaign, co-op, dungeon, ladder, settings, skills, forge, daily, journal, save and input-profile regressions. The UI harness reads the real HTML ID tree and removes descendant IDs when textContent or innerHTML is replaced; absent IDs return null instead of being recreated. Tests reproduced both reported hotfix exceptions before their fixes. The co-op check runs two independent UI contexts through the real HTML, deferred native-close events, keyboard handlers, frame loop, and room API; it verifies live motion on both screens without changing chambers, stale sequence recovery, both morphs, both reported gates, focus loss, lethal-damage revival in both directions, stalled-snapshot guest votes, and a paused-room reload with the same credentials. Transport tests cover stale held input and cancelled action retries.
- `node scripts/check-endless.mjs`: all six vessels reach at least twelve floors at baseline health, with guardian phase/volley checks; a saved floor-seven checkpoint resumes, and all twelve ladder matchups finish using real movement and manual attacks.
- `node scripts/check-duels.mjs`: all nine fighters finish matches against each of three bot difficulties across the six stages; two manual input streams finish Human versus Spark at default health, using real movement and attacks.
- `node scripts/check-opening.mjs`: all six starting vessels reach the Ivory Key and Mirror Nursery through Machine Sepulcher with ordinary health, gifts, movement, and powers.
- `node scripts/check-campaign.mjs`: solo and co-op runs clear all 126 chambers, collect eight keys, six seals, sixteen equipment rewards, all five route relics and all six hidden discoveries, visit all six vessels, and observe all three Demiurge laws. No injected health, invulnerability, or reduced-health bosses.
- `node scripts/check-campaign.mjs --trained`: complete solo and co-op campaigns with valid learned specialty fixtures, including all three final-boss phases.
- `node scripts/check-rematches.mjs`: all nine guardians with fixed practice builds; the Cantor with all six vessels; real attacks, at least five volleys, visible wind-ups, both phases and no campaign rewards. Replays must last at least 25 seconds and under three minutes.
- `node scripts/check-worker.mjs`: built Worker and real D1 integration, including the full two-UI movement/morph/gate/revive/reload check against real D1, versioned browser assets and cache headers, and default OnlineRoom clients with the browser receiver contract creating, joining, syncing, resuming and leaving a room; world/mastery/settings/cards/Table assets, guest powers/morphs/held fire and fire modes, rejected malformed fire input, learned specialties, extended guards, Eye milestones, final-world snapshots, equipment levels, training and daily state, all 126 room IDs, shared route relics/discoveries, rejected dungeon/rematch uploads, isolated profiles, and conflicting/unauthorized saves.
- Build through the installed Sites plugin’s `scripts/build-site.mjs`.

The v0.12 ordinary campaign simulations won in 3,139 seconds solo and 3,823 seconds co-op. Both cleared all 126 rooms, collected eight keys, six seals, sixteen equipment rewards, five cross-world relics, and six hidden discoveries; visited all six vessels; and observed all three Demiurge laws. The main vessel earned 1,270 mastery; the co-op partner separately earned 1,270. Largest shared snapshots were under 91 KB, below the 140 KB room API limit. All six ordinary-health openings reached the Mirror Nursery in 131–145 simulated seconds. In seed 153 endless simulations, Spark, Human, Computer, Tree and Rock cleared twenty floors; Animal cleared nineteen and died on floor twenty. Guardian checks observed both phases and repeated wind-ups. All twelve ladder matchups and all twenty-seven fighter/difficulty matchups completed, as did a full local Human-versus-Spark match. Nine guardian practice battles and six Cantor vessels completed with fixed builds and no campaign changes. Spark at practice level six beat Cantor in 49 simulated seconds after fourteen volleys, seeing both movements without retuning. Phase 1's 154 checks passed before adding the new modes; the final suite passed 169 checks. These are automated movement/power simulations, not measured human playtest timings. Independent HTTP clients cover shared combat, credentials, sequences, competing joins, expiry, reconnect state, shared keys, and guest morph/powers/fire.

Browser layout, audible quality, real PNG downloads, physical keyboard/controller use, two-device Internet play, and touch-device play remain unverified because the required browser-control skill is unavailable. DOM, controller, audio, and export harnesses verify the code path rather than a physical device. Simulations and Worker checks do not establish Internet latency or performance.

Seventeen feature-detected WebMCP tools and `window.SparkDescent` use the same runtime, including vessel powers, checkpoint world travel, Eye milestone decisions, daily runs, and between-life skill learning. Select a profile and confirm a mode through `SparkDescent.selectProfile()` / `.enter()` or the two matching WebMCP tools before using existing campaign actions. `window.SparkDuel` offers separate start, ladder, observe, bounded control, and mobile ready actions. `window.SparkVault`, `window.SparkCards` and `window.SparkTable` expose the separate keepsake systems; `SparkDescent.setFireMode()` and `.swarmPact()` select the new descent options. `window.SparkDungeon` exposes entry, start, observation, the same bounded live controls, checkpoint gifts and next-floor actions. Observations expose world unlocks, keys, seals, route relics, hidden discoveries, defeated/remaining enemies, equipped weapons, power cooldowns, current vessels, and carried essence. Multi-frame scripted movement is restricted to solo play.

The v0.12.3 investigation observed successful production sync requests from both clients in the reported room. Fresh-room movement already passed locally before the changes; the exact original freeze was not reproduced in that baseline. The added stale-counter regression reproduces silently discarded live packets and checks recovery. Gate feedback and stale held-input defects were confirmed in the UI code. The existing tester room was not joined, closed, or modified during verification.

The v0.12.5 suite checks both clients through the actual HTML, input handlers, dialogs, animation loop, and room API. It covers names, restored focus, shared pause, local guest Map, away story votes, visible Q feedback, current-vessel display, gates, and revival in both directions. Delayed, reordered cumulative input packets are checked against the room service: equal bursts keep their durations, direction changes replay once, and release leaves no held direction. Separate checks verify collision/dash prediction and input delivery while a world snapshot stalls. Built Worker tests repeat the UI flow against real D1. These checks model browser and network events; physical two-device Internet latency and live revival still need the testers’ recheck.
