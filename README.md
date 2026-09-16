# First Light — public playtest

Experimental browser game with 58 original concepts, six starters, 55 deterministic recipes, tap/tap or drag/drop combinations, a discovery journal, and browser-local save data. Designed to run on iPhone and desktop without an account or API credentials.

**Play:** Once GitHub Pages is enabled (repository Settings → Pages → Build and deployment → GitHub Actions), the site is expected at https://episode5.github.io/first-light-playtest/ . The URL must be verified after the deployment workflow succeeds; a GitHub source-code link is not the game.

This is a standalone publication of *only* the experimental game page and runtime modules. The development repository `Doodle-God-Exp` remains private. No private commit history, API keys, governance documents, model predictions, or personal label records are mirrored to this repo. It is a provisional playtest, not a released canonical graph.

Site deployment is defined in `.github/workflows/pages.yml`. It explicitly packages just `index.html`, `app.mjs`, `seed.mjs`, `dist/core/resolveRecipe.js`, and `.nojekyll`; it does not upload the repository root. Each run checks JavaScript syntax, the 58-concept seed, reachability, pair symmetry, and no-reaction behavior before packaging.

## Feedback

Play for five minutes. Note one satisfying discovery, one arbitrary/confusing discovery, and one interface problem, if any. Refreshing the page on the same browser preserves progress where localStorage is available; the Reset save button clears it.

## Originality and access

A free original game prototype, not affiliated with the creators of Doodle God. No live AI service is used in the player loop. Publishing the game files makes them publicly inspectable; that does not grant access to the private development repository. No license is granted by default beyond rights provided by law.
