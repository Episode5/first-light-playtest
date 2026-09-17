# First Light — public playtest

Experimental browser game with 58 original concepts, six starters, 55 deterministic recipes, tap/tap or drag/drop combinations, a discovery journal, and browser-local save data. Designed for iPhone and desktop without an account or API credentials.

**Original game:** https://episode5.github.io/first-light-playtest/ .

**Optional Operational Chain mechanic test:** https://episode5.github.io/first-light-playtest/chain-lab/ . This is a separate experimental browser surface, not a replacement for the original game. Its `?mode=baseline` and `?mode=chains` conditions start with the same three real witnessed recipes and use the same publicly released seed and resolver. Manually install two witnessed recipes sharing an exact intermediate, operate their stages, or divert an intermediate to test it against any owned concept. The lab's progress and counters are ephemeral and separate from the original game's localStorage save. It is not a blind playtest or evidence of enjoyment.

The private development repository `Doodle-God-Exp` remains separate. Only the experimental game pages and necessary runtime modules are public; no private research memos, architecture documents, original private experiment module, provider keys, governance fixtures or paid provider artifacts are mirrored. Neither mode has live AI, paid calls or telemetry uploads. The concept graph is provisional playtest content rather than released production canon.

Pages deployment is `.github/workflows/pages.yml`. It explicitly packages `index.html`, `app.mjs`, `seed.mjs`, `dist/core/resolveRecipe.js`, `chain-lab/index.html`, `chain-lab/app.mjs` and `.nojekyll`. It does not deploy the repository root. Deployment checks JavaScript syntax, the full seed, pair symmetry and chain fixture before publishing.

## Feedback

For the original game, note one satisfying discovery, one arbitrary/confusing discovery and one interface problem. The original save persists on the same browser where localStorage works and its Reset button clears it. For the chain experiment, try both modes and assess whether installing and diverting a known recipe gave you a reason to experiment with an old concept; also note any extra taps or repetitive known-stage operations. Avoid treating the pre-seeded fixture or a prompted combination as an independent discovery.

## Originality and access

A free original prototype, not affiliated with the creators of *Doodle God*. Publishing these game files makes them publicly inspectable; this does not grant access to the private development repository. No license is granted by default beyond rights provided by law.
