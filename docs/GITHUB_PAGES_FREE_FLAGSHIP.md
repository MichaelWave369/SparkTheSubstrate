# Spark Free Flagship: GitHub Pages Edition

Spark: The Substrate is intended to be **free to play and MIT open source**,
alongside the independently public Break the Matrix. This page defines the
static GitHub Pages release contract, distinct from the full Worker/D1 app.

## URLs after the first successful deploy

- Game landing page: **https://michaelwave369.github.io/SparkTheSubstrate/**
- Experimental VR route: **https://michaelwave369.github.io/SparkTheSubstrate/vr/**
- Equivalent explicit VR file: **https://michaelwave369.github.io/SparkTheSubstrate/vr/index.html**

These URLs were verified publicly reachable when Spark first launched
on GitHub Pages on 2026-10-27. Later changes still require green GitHub
Pages deployment and live browser re-verification. The workflow reports
its actual page URL as the `github-pages` environment.

## What's included on GitHub Pages

- Original Spark Descent, Daily, Endless Dungeon, Sideways, Duel, Vault,
  Memory Arcade and Echo Lives static gameplay assets.
- All preserved historical Memory Arcade cabinets in `public/legacy`, with
  working project-relative source receipt links.
- The experimental seven-world stereoscopic WebXR **solo Descent traversal**
  drawn from all 126 canonical Spark rooms. Original engine gate, combat,
  gift, karma, morph, rebirth and victory rules remain authoritative.
  The VR-only browser-local checkpoint never overwrites the original
  Descent or Sideways saved progress.
- Browser-local progress for solo modes, using the normal Spark save mechanism.
- All static JS, CSS, image and source-receipt assets from `public/`.
- The original game engine and saved-progress formats remain unchanged.

## What the Pages edition does NOT include

- No Cloudflare Worker, D1 database, hosted API routes, multiplayer/co-op
  rooms, or automatic online/cloud save backups.
- No implicit cross-domain save migration from a separately hosted Spark app:
  browser-local progress belongs to the origin and site where it was created.
- No claim of working without any internet connection after first visit.
  GitHub Pages supplies files through HTTPS but does **not** itself install
  an offline service worker or cache the full game. The game is local-first
  with respect to solo save data, not fully offline-certified.
- No claim that real Quest 3 controllers, sustained frame rates, comfort
  or stereoscopic geometry have passed physical headset tests. Software CI
  tests only the protocol and engine behavior.
- No user account, tracking SDK, automatically published or redistributed
  personal game-save file, or paid content gate.

## How the GitHub Pages deployment works

`.github/workflows/pages.yml` is the only GitHub Pages publication workflow.
It runs the full existing Spark Node regression suite and the additional
static site compatibility tests on pull requests.

On the **main** branch (or an explicitly dispatched workflow after enabling
GitHub Pages with source **GitHub Actions**) it:

1. Checks out the approved source commit and verifies all gameplay and VR
   tests using Node.js 22.
2. Runs `node scripts/build-pages.mjs` to copy **only** `public/` into
   `.pages-site/` without modifying the canonical source directory.
3. Adds a prominent Pages-specific notice that online rooms/cloud backups
   are unavailable, and injects `window.SPARK_STATIC_PAGES=true` before the
   existing `descent.js` entry module.
4. Uses the runtime flag to **hide/disable online room entry**, prevent any
   cloud-backup setup or online resume and keep existing device-local save
   behavior intact. The normal Worker/D1-hosted app never receives this flag.
5. Publishes the validated `.pages-site` folder with GitHub's official
   `configure-pages`, `upload-pages-artifact`, and `deploy-pages` Actions.
   The staging output is ignored by Git.
6. GitHub Actions displays the `github-pages` deployment environment and
   the canonical site URL after publication.

The deployment job does not upload `server/`, `app/`, `lib/`,
`drizzle/`, `.openai/hosting.json`, the Git checkout, your local settings,
or an environment file.

## Operator checks after deployment

- [ ] In **Settings → Pages**, select **Build and deployment / Source:
  GitHub Actions**. Do not configure branch-root deployment alongside it.
- [ ] Merge the deployment PR only after its test job is green. The merge
  triggers a separate `main` workflow that uploads and deploys the site.
- [ ] Visit the reported Pages URL and confirm the edition banner is visible,
  the profile selection works, and Host/Join room buttons are absent.
- [ ] Start a solo Descent and verify a device-local save survives a reload.
- [ ] Enter Sideways and confirm the separate Sideways save survives reload.
- [ ] Enter a preserved Memory Arcade cabinet and open a provenance receipt.
  The URL must remain under `/SparkTheSubstrate/legacy/`.
- [ ] Open `/SparkTheSubstrate/vr/` on desktop and confirm all seven
  world styles, game choices, separate VR save and cross-room travel load.
- [ ] On an actual Quest 3, visit the HTTPS VR route in Quest Browser. Test
  **Enter immersive VR**, stereo, head pose, left-stick motion, snap turn,
  trigger powers, right-grip gate entry, right-B vessel morph,
  left-stick/A/trigger decision selection, death-and-rebirth
  checkpoint recovery and session exit.
- [ ] Verify no browser console errors or missing image/module URLs.
- [ ] For a true offline-download edition, make a separate, tested,
  cache-verified packaged release rather than claiming Pages is offline.

## License and publication boundaries

Original covered code and docs are MIT licensed. Upstream dependencies and
third-party content retain their own licensing obligations; artwork and
historical versions still require their appropriate rights/attribution.
Review `LICENSE`, `ASSETS_AND_ATTRIBUTION.md`, `SECURITY.md` and
`docs/OPEN_SOURCE_RELEASE.md`.

**Passing Pages CI proves deployable files, not gameplay perfection,
historical artifact licensing, live backend security or physical Quest 3
qualification.** Never silently turn the Pages edition into an authorization
for D1 access or multiplayer rooms.
