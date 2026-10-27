# Spark: The Substrate — Public MIT launch readiness

Status: **REVIEW CANDIDATE. Do not switch this repository to public based on this document alone.**
Last reviewed: 2026-10-27.

## Intended public commitment

Spark is intended to be a **free-to-play, open-source, MIT-licensed** flagship
alongside Michael Wave & Ori: Break the Matrix (BTM). These are independent
games with independent repositories. Charging players for Spark is not part
of the project's plan.

The MIT license nevertheless allows third parties to reproduce, modify,
redistribute, sublicense **and sell** covered software provided that the
copyright and license notices are retained. If the objective is to forbid
commercial derivatives, MIT is not the appropriate license.

## Source audit completed for this preparation

- The repository is currently **private**; its main branch is not yet an
  approved public release.
- The main tree was inventoried through GitHub's repository tree API:
  **527 tracked files**, including canonical Descent, Sideways, Duel,
  Memory Arcade historical snapshots, art atlases and the new two-room
  experimental WebXR prototype.
- The repository previously lacked a root `LICENSE`; this PR proposes
  the standard MIT license for original software and accompanying docs.
- No obvious committed `.env`, private-key or database file name appeared
  in the current main-tree inventory. **This is not secret scanning**:
  contents, build artifacts, previous commits, branches and GitHub Actions
  logs still require an independent full-history review.
- The game uses Next.js and Cloudflare Workers/D1 as well as static files
  in `public/`. GitHub Pages alone cannot operate the online co-op or
  server-side campaign backup without a separate backend.

## Release gates: do not declare complete without evidence

- [ ] Confirm every author/contributor has agreed that their original
      contributions can be published under MIT. Dependencies retain their
      own upstream licenses.
- [ ] Verify original artwork and all image-generator outputs are eligible
      for the planned redistribution; review all archived legacy sprite
      sheets, `.webp` atlases, `.png` posters and any third-party files.
      See [Assets and attribution](../ASSETS_AND_ATTRIBUTION.md).
- [ ] Audit **all reachable branches and Git history**, not merely the
      latest snapshot, for secrets, tokens, API URLs containing credentials,
      private customer/user information, or assets that cannot be published.
- [ ] Review prior GitHub Actions **logs and artifacts**, which GitHub
      makes publicly visible when visibility changes. Remove/rotate any
      exposed secret. Deleting an exposed file from the latest commit alone
      does not secure previous copies.
- [ ] Confirm server and online play do not depend on a private trust
      assumption; test Cloudflare D1 access controls, room authorization,
      rate limits, log privacy and abuse handling before inviting the world.
- [ ] Check the currently open **PR #12 / Rung 59** failed experimental
      inference evidence separately. It is **not** part of the merged VR PR
      and should not be treated as a VR regression.
- [ ] Verify canonical Descent/Sideways/Duel/Memory Arcade test suite,
      production build, static assets and support links under the final
      public base URL.
- [ ] Test `/vr/index.html` through HTTPS. The two-room first slice is
      experimental: real Quest 3 stereo, controllers, comfort, tracking
      interruptions, performance and save isolation require hands-on tests.
- [ ] Confirm a website privacy policy if multiplayer or cloud save
      infrastructure persists user-generated data; document retention and
      safe reporting contact.
- [ ] Verify the player-facing download/site packaging does not include
      development-only archived build artifacts or private infrastructure
      metadata needlessly.
- [ ] Review a final diff and explicitly approve the irreversible
      disclosure of the repository's source, history and Actions logs
      before making visibility **public**.
- [ ] Enable suitable GitHub secret scanning, Dependabot, code security
      alerts and a vulnerability reporting path as available to the account.
- [ ] After approval, choose hosting: retain existing Cloudflare-powered
      full application, and optionally create a separate *static-only*
      GitHub Pages distribution of offline-capable modes. Pages does not
      host Worker/D1 backend APIs.

## Publication principles

**People Above Profit, Ledger Above Ego.** Free gameplay and MIT source
mean the public can play, study and extend Spark, with clear evidence about
what is implemented and what is not. No advertisement SDK or paid feature
gate is required to support the release.

Do not silently equate a passing software CI workflow with a fully
playtested headset experience; physical Quest 3 acceptance is a separate
milestone.

Links:
- `docs/vr-first-slice.md` (real canonical Spark engine XR subset)
- `docs/canonical-architecture-v0.17.0.md` (game modes and save separation)
- GitHub's official repository visibility guide:
  https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility
