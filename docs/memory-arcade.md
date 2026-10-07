# Spark v0.15.2 · memory arcade

## The location

**The Memory Arcade** is a peaceful physical annex to the Sideways Threshold. Walk east past the scavenger, existing Vault and Memory Imprint altar. The CRT doorway is at x1210; E / RT / GATE enters it. It has no start-page Extras button. The current journey is saved before entry and remains at the same doorway, with its clock and injuries held while the archive or an old game is open. Walking to the western exit returns to that body. Save & return from the archive returns to the current start page.

The existing Vault keeps its name and economy. Archive tokens have a separate collection role. No new world, vessel, god, campaign ending or combat rewrite is introduced.

“The body falls. The spark remembers.” Here the discarded bodies are actual earlier versions of Spark.

## Real historical builds

The inspected repository contains 25 historical commits on its main line and no historical tags or alternate branches. These seven recoverable milestones are shipped as **AUTHENTIC LEGACY BUILD**, not recreated simulations.

| Cabinet | Version | Exact source commit | Original root | Playable objective |
| --- | --- | --- | --- | --- |
| Echo Lives | 0.1.0 | `798613099d38c3a9de7f098ff4d5a617c4e8c048` | `dist/` | Finish a six-choice life and reach the original crossing or awakening. |
| First Descent | 0.2.0 | `eeca7f3bf167a1880bbd4d15c6d4d4211a4c94e2` | `dist/` | Clear the historical Glass Causeway; the original nine-room stratum remains playable. |
| First Duel | 0.12.1 | `e65856cbad5a24df9d292ab896e6bcac1a52aba0` | `public/` | Win a complete first-to-two match as Player 1. |
| First Sideways | 0.13.0 | `37adc81f6c1ed6211c885e7aac293f7075ba8bca` | `public/` | Clear the historical side-view Glass Causeway; the original 27-room route remains available. |
| First Endless | 0.9.0 | `73d7d9bce0683daf075fd706f6cbad6a75790cc7` | `public/` | Clear the first five historical dungeon floors, including the floor-5 guardian. Keep descending if desired. |
| First Forge | 0.4.0 | `ce6d1fbf8cf5bdc1bbdaddbe6be32f1fb055ea22` | `public/` | Earn essence in a life, bank it by ending that life, then enhance any owned relic or ward to +1. |
| First Mastery | 0.7.0 | `4cfd6fa79b8bfd19828f0878182375f6f86a906d` | `public/` | Clear two chambers as one vessel, bank its mastery, learn a skill and use its power in the next life. |

First Duel uses the genuine v0.12.1 start-page repair. The broken v0.12.0 snapshot is not silently repaired and presented as an original working build. Earlier Duel verbs, HUDs, animation, guardian behavior, art and historical limitations are retained. First Sideways predates the current physical coins, merchants, imprints, grabs and throws. Echo Lives preserves the original choice simulation rather than using the modern Echo page.

First Endless preserves the v0.9 dungeon’s original fleet/crowd/fault/wither conditions, 18-HP ordinary checkpoint healing, 8-HP withering heal, five-floor guardian cycle and build carry-over. Its BEST record updates after a fall, and its old room names remain. These are documented historical quirks, not regressions in the current dungeon. The wrapper enters the genuine historical dungeon API and observes `floorsCleared` rather than accepting the current floor number or the death-only BEST record. No combat, guardian tuning or checkpoint logic is modernized.

First Forge preserves the original relic/ward slots, 3-essence first enhancement, automatic fire and early room choices. Its native observation API does not expose inventory, so the safety shell reads only that cabinet’s own saved metadata to recognize a real enhancement after a remembered life. No inventory or essence is supplied by the wrapper. First Mastery preserves the original six skill trees, 20 mastery per point, per-chamber practice and between-life learning. Completion requires both a banked skill and that skill in the new body’s original training snapshot, plus an actual power use. Practice alone or a skill learned after the old body has ended cannot satisfy it.

`scripts/preserve-legacy.mjs` extracts these exact Git blobs and compiles their original imports into a classic IIFE for opaque-sandbox execution. The raw source and assets remain under `public/legacy/<id>/`; a `provenance.json` receipt records the commit and SHA-256 of every original blob and generated payload. The tests compare those receipts to actual Git contents. The wrapper, bootloader, CSP, removal of external font imports and offline storage/transport are packaging changes, not historical gameplay changes.

The manifest in `public/memory-arcade-manifest.js` defines identity, authenticity, source commit/root, controls, art, physical placement, discovery, completion rule, reward and launch target. Placement and collection totals derive from the manifest. Per-device discovered/completed state is kept separately. A new historical cabinet does not require rewriting the room controller.

## Discovery and the complete flow

| Cabinet | Current-world discovery |
| --- | --- |
| Echo Lives | Available on first entering the Arcade. |
| First Descent | Clear Glass Causeway, then E / RT / GATE at its dim floor terminal, x1450. |
| First Duel | Revisit cleared Machine Sepulcher as Computer and touch its western terminal, x480. |
| First Sideways | Clear Mirror Nursery and touch its preserved floor screen, x1500. |
| First Endless | Clear the Cinder Regent, then touch the violet terminal at x450 on the western floor of the Regent’s Furnace. |
| First Forge | After clearing the Cantor, touch the amber terminal at x420 on the western floor of the Echo Forge. |
| First Mastery | At the Moonless Dock, inhabit Computer and touch the green terminal at x1330 on the eastern floor. |

The terminals carry `?` markers and give clear feedback before the room is cleared or the vessel requirement is met. M / View inside the Arcade opens concrete journal clues. Discoveries awaken the corresponding cabinet; approaching it and pressing E shows controls, version, type, completion state, lore and its source receipt before Play. Unfound machines offer their clue instead of a nonfunctional Play button.

New tests also earn the current route to the Moonless Dock, discover both new terminals with the native UI, walk back along the earned route, complete both old progression objectives and reload their private saves. The tested player flow is current Glass combat → E discovery → ordinary walking back to Threshold → E Arcade entry → approach/read cabinet → Play → genuine historical completion → token and trail → Return → same current room/build → reload. Launching without completing grants nothing.

## Isolation and storage

Each launch creates one iframe with `sandbox="allow-scripts"`, without `allow-same-origin`. Its classic program boots after a parent handshake. CSP authorizes only the generated program and safety shell by hash, denies network connections and nested frames, and allows only its own project art. An explicitly scoped production image URL also covers older opaque-origin CSP implementations. Legacy transport is offline; online rooms and remote progress writes cannot run from an old cabinet.

The iframe has a private in-memory Storage implementation. It receives only that cabinet’s dictionary, never the parent Storage object or current-save credentials. The parent accepts messages only from the active frame, for the current cabinet ID and a random per-launch capability. It validates bounded dictionary snapshots and genuine engine observations before storing saves or recognizing an objective. Forged sources, wrong capabilities and stale messages from removed frames are rejected. This is an isolation boundary, not an anti-cheat claim against someone editing their own device.

| Storage key | Content |
| --- | --- |
| `spark-substrate-memory-arcade-v1` | Optional collection, completed cabinets, First light preference and room position. |
| `spark-substrate-legacy-echo-lives-v1` | Echo Lives’ private historical dictionary. |
| `spark-substrate-legacy-first-descent-v1` | First Descent’s private historical dictionary. |
| `spark-substrate-legacy-first-duel-v1` | First Duel’s private historical dictionary. |
| `spark-substrate-legacy-first-sideways-v1` | First Sideways’ private historical dictionary. |
| `spark-substrate-legacy-first-endless-v1` | First Endless’s private v0.9 dictionary, including its original dungeon record. |
| `spark-substrate-legacy-first-forge-v1` | First Forge’s private v0.4 campaign and equipment dictionary. |
| `spark-substrate-legacy-first-mastery-v1` | First Mastery’s private v0.7 campaign, training and settings dictionary. |
| `spark-substrate-endless-v1` | Existing modern dungeon save; unchanged and distinct from the same key inside the old dictionary. |
| `spark-substrate-descent-v2` | Existing campaign save; unchanged. |
| `spark-substrate-sideways-v1` | Existing Sideways schema-2 save and migration; unchanged. |

The current keepsake bank, Table, binder, Duel and co-op profile namespaces remain separate. Old keys, seals, essence, coins and mastery stay inside the old dictionary. Cabinet reset explicitly confirms and removes only its private dictionary. Tokens survive reset. Current New Save and New side journey replace their existing journey scopes and preserve the optional archive collection. Missing/corrupt legacy data defaults safely. If the current journey cannot be saved, entry fails with feedback and the current animation loop keeps running. The existing active-Sideways-tab lease also disposes an old cabinet runtime on ownership loss.

ESC, controller View and the persistent **Return to Memory Arcade** button save and remove the frame. Fullscreen belongs to the outer shell so Return remains present. Boot timeout, asset failure and uncaught legacy errors return to a safe error panel without a token. Disposal cancels wrapper timers/animation frames, releases input and closes audio; removing the frame ends its execution context. A new launch cannot leave a second old game running behind it. `document.modelContext` is disabled in old runtimes so they cannot replace the current tool registrations.

## Collection, rewards and environment

Each of the seven cabinets awards one **Archive token** on its first objective completion. Repeating the objective or resetting a cabinet cannot farm tokens. Tokens are a record of unique experiences, not a spendable currency. The first completed cabinet unlocks and enables **First light**, an optional amber trail for the current side-view spark, toggled at the gallery or clues terminal. No campaign key, seal, essence, mastery or Substrate coin is granted. The main journey remains completable without visiting the Arcade. Existing four- and five-cabinet collections keep their tokens, discoveries, saved games and trail preference. No save schema migration is needed for the two additions.

The room combines shrine masonry, dim CRT scan lines, cables, bounded dust, floor glyphs and distinct glass/ivory/circuit/root cabinet materials. Found screens light up. Completed pedestals and trophy diamonds remember the player’s visits. Existing bodied sprites animate on the screens. The gallery is a physical terminal and reveals the actual discovered world, arena, fighter and stage atlases, with source versions and commits.

First Endless adds a cracked violet fault cabinet and a five-floor CRT signal. Its discovery unlocks the original stratum floor atlas in the gallery. The trophy shelf and far-end objects derive their positions from the cabinet collection, keeping all seven machines clear of the gallery. First Forge adds an amber enhancement signal and its original equipment atlas; First Mastery adds a root-lit skill-tree signal and its original six-vessel atlas. Their labels, gallery, seven trophy spaces and far-end seal remain legible as the room expands. Discovery labels sit above the bodied player so standing on a terminal does not hide its clue. The museum expands as a room; it does not add another campaign world.

The sound archive replays four original v0.2 sine-sweep effects: construct hit, gift, fall and Warden victory. There are no preserved recorded title songs in this slice. The 72 Hz room hum is explicitly labeled current ambience; it follows sound settings and stops on exit. No third-party music is added.

**The Unwritten** is a sealed machine at the far end. Its manifest identity is `fictional-hook`, with `launch:null`; it is not claimed as recovered history. It has no Play button or invented version. Its purpose is a later, still-unexplained hook.

## Controls and accessibility

Arcade keyboard: A/D or arrows walk, Space jumps, E reads/uses/exits, M shows clues, Esc closes a plate or pauses. Controller: stick/D-pad walks, A jumps, RT interacts, View shows clues, Start pauses. Mobile reuses the existing stick and JUMP/GATE controls. Menus accept D-pad selection and A confirmation.

Each old game presents its real keyboard controls on its cabinet and in the shell. A small wrapper relays controller inputs and mode-specific touch buttons as those original keys. Echo has choice buttons rather than a fictitious Jump action; the early top-down game uses Dash; Duel has its original light/heavy/launcher/power/super; Sideways keeps jump/strike/heavy/dash. First Endless has power, dash, vessels and all three choice keys, with no fictitious Jump button. Controller menu selection also works when the old run resumes paused and inside the original forge, skills and settings dialogs. Start reaches the original Pause menu without using ESC, which remains Return. The wrapper maps the pad once to PC keys; old native gamepad pollers do not apply the same input a second time. First Mastery’s F power remains separate from its third choice button on touch. Old menus remain operable. Sound begins muted; Allow cabinet sound permits the historical game’s own sound switch. Return is always outside the old game. Settings and current profile remain authoritative for the wrapper.

## Performance and verification

The current arcade modules and CSS total 52,698 bytes uncompressed, without another modern image atlas or dependency. Roughly 54 MB of frozen source, payloads and original art are hosted for preservation; they are not all downloaded at startup. A cabinet HTML/program loads only on Play. Gallery images use lazy loading and appear only in the optional gallery. The historical engines’ original asset initialization is retained on launch. One iframe runs at a time; tests exercise repeated launch/dispose and verify wrapper audio, timers and frame references are cleaned up.

Release evidence:

- 294 engine/DOM-harness tests pass, including 29 arcade tests for SHA receipts, discovery, save scope, reload/new-life behavior, stale/spoofed bridge rejection, reset, failure teardown, input profiles, held touch, source boot and unavailable-save recovery. New checks cover the guardian discovery, five cleared floors versus merely reaching floor 5, old four-token collection compatibility, native dungeon entry/resume, and the third touch choice key. Additional tests cover retaining five completed cabinets, forge/mastery proof boundaries, both new discoveries, active-dialog controller selection, controller Start → bank-life flow, a single controller input bridge and the separate mastery touch power.
- `scripts/check-memory-arcade.mjs` boots all seven actual frozen bundles and completes their objectives using ordinary player inputs and default health. It wins a full early Duel match, clears the original five-floor dungeon guardian, earns and spends 3 essence at the original forge, and earns 20 mastery before learning and using the new body’s power. It verifies old save/reload/disposal and the current physical discovery-to-completion flow. No health, enemy, currency or achievement injection establishes these objectives.
- `scripts/check-arcade-endless.mjs` earns the Cinder Regent through current normal-health combat, discovers its terminal through the UI, walks back along the earned route, launches the real v0.9 dungeon, clears five floors, feeds its capability-bound proof into the current room, returns, resets and reloads. Current campaign, current dungeon and current Sideways saves remain unchanged across legacy play. The token survives cabinet reset.
- `scripts/check-arcade-training.mjs` earns the Cantor and the normal-health route through the Weaver to the Moonless Dock, reads both new physical terminals, backtracks to the Arcade, plays the actual v0.4/v0.7 objectives, recognizes their capability-bound proofs, and verifies old save/reload/reset with current campaign, dungeon and Sideways saves unchanged during legacy play.
- The existing normal-health Sideways route clears all 27 rooms, eight guardians, seven keys and six vessels, including the Animal Feather and both directions of its seam.
- The built Worker checks static modules, every legacy launch and original image, provenance and safety headers, plus the existing D1 two-client co-op, downed/held-E revive under latency, votes, profiles, authentication, campaign snapshots and separate daily/endless/rematch scopes.
- Four production Canvas scenes were rendered and inspected for v0.15.0: the Threshold entrance, first archive visit, an evolved collection and the sealed machine. Two further scenes inspect the fifth cabinet and the five-trophy gallery. Six new production renders inspect First Forge, First Mastery, the seven-trophy gallery, the sealed hook and both current-world discovery terminals; overlapping discovery labels were raised above the player. Layout conflicts found during rendering/walking were corrected.

Long legacy test runs now discard replaced DOM nodes and retain only the latest save/observation packets in the harness. This prevents test-only accumulation that a real document would collect; it is not presented as a measured browser-memory improvement. Packaging now uses stable relative source paths, so temporary extraction directory names do not change the compiled historical program hashes.

The prescribed browser-control skill is unavailable in this managed environment. This is not a browser-console-zero, device-play, audible-quality, live Internet-latency or browser-FPS claim. Physical keyboard, gamepad, mobile layout, old-art decoding, opaque sandbox behavior, browser memory after repeated launches and fullscreen/audio policy need live testing. Native Canvas rendering and the DOM/runtime harness establish code-path behavior, not a browser performance measurement. No known automated-check failure remains; the live-device items are unresolved verification limits.

Reproduction: `npm test`; `node scripts/check-memory-arcade.mjs`; `node scripts/check-arcade-endless.mjs`; `node scripts/check-arcade-training.mjs`; `node scripts/check-sideways.mjs`; build with the installed Sites build helper, then `node scripts/check-worker.mjs`. Rebuild frozen payloads only when packaging changes with `node scripts/preserve-legacy.mjs`; the historical source commits remain fixed.

## Recovery complete and next rung

All seven meaningful historical milestones identified for this recovery are now runnable cabinets. The remaining patch snapshots are still preserved in Git; they are not presented as extra games with identical objectives. The Unwritten remains sealed and explicitly fictional.

The next rung is a live keyboard/controller/mobile check of all seven launch → original menu → save → Return flows, especially spending essence and selecting a remembered skill with a controller. Check actual art decoding, fullscreen, sound and browser memory after repeated launches. Existing automated evidence does not substitute for that device playtest. No further historical milestone is claimed or invented here.
