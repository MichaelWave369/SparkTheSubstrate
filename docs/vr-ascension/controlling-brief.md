# SPARK VR: ELEMENTAL ASCENSION — Rung 1 controlling brief

Authority: MichaelWave369's explicit implementation request, 2026-10-29.
Baseline: SparkTheSubstrate `a26b94efd5aa7787e390bc50254bce97588608f1`.
Candidate identity: Rung 1 / `spark.xr.runtime.v1`, not a new campaign version.

Implement Rung 1 in MichaelWave369/SparkTheSubstrate. Inspect `public/vr/`, the
canonical `action-engine.js` and `duel-engine.js`, VR tests and immersive BTM
patterns. Preserve existing modes, progression, saves and desktop controls.
Build a reusable, versioned XR interaction layer instead of forking the engines.

1. Two fully tracked virtual controller hands with distinct vessel-themed energy.
2. Hand-directed magical projectile, charge/release throw and reliable trigger-only
   fallback. Hit resolution, costs, cooldowns and damage stay in canonical Spark rules.
3. Bounded physical dodge/lean/duck plus controller dodge. Validate XR pose as gameplay
   input and protect tracking/collision boundaries.
4. Readable projectile windups, moving attacks, impacts, spatial sound where supported
   and optional haptics.
5. Playable arena, preferably Duel, with at least one complete repeatable encounter.
6. Reusable XR runtime/presentation with mode-specific adapters for Descent, Sideways
   and future modes.
7. Seated/standing presets, snap turn, speed, vignette, recenter, tracking-loss pause,
   reduced intensity and accessible exit.
8. Desktop 3D preview and no-headset testing.
9. Automated input-edge, authority, isolation, cooldown, collision, missing-pose,
   cleanup and regression tests.
10. Quest 3 Field Lab checklist extensions; no physical hardware verification claim.

Keep seven-world Descent VR operational. Preserve MIT/open source, GitHub Pages,
save namespaces and separate online services. Use original/permissive assets with
attribution, no unnecessary dependencies or remote runtime assets. Prepare one
reviewable PR with tests, implementation notes, Quest 3 steps and honest limitations.
Do not merge automatically.

Authority order: this user instruction; this faithful brief; documented implementation
decisions; existing conventions. No contradictory amendments or release authorization.
No decision is required to prepare the requested PR. Human review/merge and actual
headset acceptance remain outside implementation authority.
