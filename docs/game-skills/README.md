# Φ Game Skills: Spark Rung 2

BTM PR #7 proved project-specific WebXR guidance can be checked and reviewed. Spark demonstrates a portable phi-game-skills/v1 JSON manifest with a different engine fingerprint, separate project-owned instructions and pinned cross-engine concepts.

## Commands

    node scripts/route-game-skills.mjs --validate
    node scripts/route-game-skills.mjs --list
    node scripts/route-game-skills.mjs --task "Quest controller recovery" --json
    node scripts/route-game-skills.mjs --task "World art direction" --load
    node --test tests/game-skills.test.mjs

The router is a development-only deterministic selector. It matches normalized words and phrases, loads only selected instructions, has no external networking and executes none of the skill contents. Unknown engines fail closed. No 'fps' trigger confuses first-person-shooter with frames per second.

Spark skills: spark-router, spark-quest-input, spark-world-art, spark-progression.
Pinned upstream skills: create-game-assets, game-ai, performance-optimization. Full related local references/templates and optional helper source code are bundled; none run automatically.

## Attribution and maintenance

Unchanged third-party skills and supporting files are from gamedev-skills/awesome-gamedev-agent-skills, commit 19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9, Apache-2.0. Full LICENSE and NOTICE are included in this directory. The Spark-owned MIT code retains its original license.

Review and pin any upstream refresh before changing the bundle. No automatic remote updates, global installs or runtime modification. AGENTS.md and the versioned manifest are the portability contract.

## Preservation gates

The change contains no public game assets or runtime edits and cannot affect production Pages output. Run the dedicated skill CI and existing canonical Node tests. Quest browser emulation is not a physical headset test; docs/QUEST3_FIELD_LAB.md remains authoritative for manual hardware evidence. Next step, after both pilots prove useful, is factoring the manifest runner into a shared standalone package, with each game retaining its own local skill adapter.
