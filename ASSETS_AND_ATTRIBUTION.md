# Spark asset provenance and attribution

**Review state:** preliminary inventory only; not an assurance that every bundled
file can be sublicensed under MIT. This manifest must be completed before the
repository changes from private to public.

## Intended rights treatment

The project intends to distribute its **original game software and
original, rights-cleared creative work** freely under the MIT license.
Third-party software, art, fonts, trademarks and other components **retain
their applicable upstream terms**; no project statement can grant rights
that a contributor does not hold.

The root `LICENSE` contains the conventional MIT grant for covered original
software and associated documentation. This file records review items,
not a retroactive rights grant for unknown materials.

## Inventory checkpoints

| Family | Representative tracked paths | Evidence / next check |
| --- | --- | --- |
| Original game code | `public/action-engine.js`, `public/descent.js`, `public/sideways-engine.js`, `public/vr/*.js` | Confirm author/contributor consent and any incorporated snippets |
| Original narrative and documentation | `public/story.js`, `public/world-story.js`, `docs/**` | Confirm original prose; review quoted third-party text |
| Current raster atlases | `public/sprites.webp`, `public/enemies*.webp`, `public/world*.webp`, `public/floors*.webp`, `public/equipment*.webp`, `public/duel-*.webp` | Examine actual image sources and any third-party references |
| Promotional artwork | `public/spark-poster-v1.png` | Confirm generation/source history and publication permission |
| Archived Memory Arcade builds | `public/legacy/**` | Verify preserved historical source and image licenses; archival hash receipts prove byte identity, not ownership or redistribution permission |
| Starter SVG illustrations | `public/file.svg`, `public/globe.svg`, `public/window.svg`, `public/favicon.svg` | Confirm ownership or original upstream license before asserting MIT status |
| Application dependencies | `package.json`, `pnpm-lock.yaml` | Do not relicense packages; publish required third-party notices where their licenses demand it |
| Infrastructure/config | `.openai/hosting.json`, `drizzle/**`, `server/**` | Check for private identifiers and deployment coupling before public disclosure |

## Existing generation evidence

`art-prompts-v12.md` describes generating
`public/duel-fighters-v12.webp` with the built-in image-generation tool
and referencing the project's prior original Spark images. That is useful
**provenance documentation, not proof of exclusive copyright**.

The historical Arcade `public/legacy/*/provenance.json` receipts record
past commit origins and SHA-256 source hashes. They help track authenticity
and preservation but do not prove that underlying art or snippets can
be licensed onward.

## Human sign-off before visibility change

- [ ] Original author confirms own contributions and grants MIT rights to
      original code and documentation.
- [ ] Art creator/operator reviews current and historical atlases, poster,
      derivative works, and all source licenses.
- [ ] Review upstream notices, any dependency redistribution terms and
      built-in starter assets.
- [ ] Decide whether all original art is explicitly MIT alongside code.
      If some art must instead retain another valid license, identify each
      affected path and include its terms visibly before publication.
- [ ] Ensure the public site and any offline releases ship attribution and
      source/license information clearly.

This is not legal advice. Its purpose is to **avoid claiming rights
we have not actually established**, while preserving the goal of
free gameplay and genuinely reusable source code.

## SPARK VR: Elemental Ascension — Rung 1

The controller gauntlets, charge seeds, arena, Archon geometry, windup corridor,
projectile and impact geometry in `public/vr/spark-vr-renderer.js` are original
procedural artwork created for Spark. Arena sounds in `spark-xr-feedback.js` are
original Web Audio oscillator synthesis. These additions use this repository's
MIT license. No external artwork, models, textures, audio files, runtime CDN,
asset downloads or new app dependencies are required. Optional browser QA uses
Playwright as isolated development tooling; it is never shipped with the game.

## SPARK VR: The Living Substrate — Rung 2

The room themes, beams, faceted energy/crystals, six vessel gauntlet variants,
wrist UI, procedural atmospheric geometry and synthesized vessel/room tones in
`public/vr/` are original additions covered by the repository's MIT license.
Existing Spark geometry helpers were extracted into `spark-vr-geometry.js`.
No BTM engines or assets were copied; its runtime/equipment patterns informed the
design. No new app dependency, runtime download, CDN, paid API or remote telemetry.
Browser evidence uses isolated Playwright/Chromium development tools; those
executables and packages are not distributed with Spark.

## SPARK VR: The Awakening Hands — Rung 3

The six attack animations, planar targeting guides, Echo Forge architecture and
rotors, Cantor model, canonical warning/health geometry, impact/victory presentation,
More Bounce dancing echoes and bubbles are original procedural artwork. The short
vessel cues, three-note celebration rhythm and triangle-oscillator giggles are
original Web Audio synthesis, with no sampled voice or commercial music. These
additions use the repository's MIT license. MoreBounceLabs' hosted music catalog
and other repositories' assets are not imported. Evidence PNGs are captures of the
actual software-WebGL application, not generated mockups or headset photographs.
No additional app dependency, remote runtime asset, paid service or telemetry.

## SPARK VR: The Warden Awakens — Rung 3.5

The Demiurge's Eye chamber, obsidian/gold ribs, celestial mechanisms, responsive
Eye, Warden armor, distinct summoned hound silhouettes, locked lane guides and
bounded dissolution/fracture effects are original procedural artwork created
with Spark's existing geometry helpers. The optional phase cue uses the existing
original oscillator synthesis. These additions use the repository's MIT license.
No external art, audio samples, models, remote runtime assets or app dependencies
are added. Evidence PNGs show the actual Chromium/software-WebGL game, not
illustrations or photographs from a Quest headset. Existing asset notices above
remain applicable to their respective assets.

## SPARK VR: Quest Reality Pass — Rung 4

The mirrored controller gauntlets, thin vessel accents, calibration fixtures,
compact wrist artwork, bevel masonry, arches, gate ribbons, vaulted Threshold,
Glass Causeway fins, Machine Sepulcher mechanisms and revised ordinary enemy
silhouettes are original procedural geometry/code covered by the repository's
MIT license. The existing Spark poster informed palette and silhouettes; its
raster image is not sampled into new textures. No downloaded models, textures,
audio, fonts, paid services or runtime dependencies are added. Existing material
and fog shaders, synthesized audio and guardian presentation are reused.

`tests/fixtures/vr-r35-hands.mjs` preserves the original MIT Rung 3.5 hand geometry
from merged main solely for a labeled rendered comparison. Evidence PNGs in
`docs/vr-reality/` are actual Chromium/software-WebGL output with synthetic
poses, not generated artwork or photographs captured inside a Quest. The
WebXR grip/ray conventions follow the primary specification:
https://www.w3.org/TR/webxr/#xrinputsource-interface.
