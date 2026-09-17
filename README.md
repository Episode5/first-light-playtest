# First Light — public playtest

First Light is a deterministic concept-combination discovery game built for fast mobile play.

**Play:** https://episode5.github.io/first-light-playtest/

## v0.2 — Mobile Mastery

This build concentrates entirely on the core discovery loop.

- 100 original concepts;
- six starters;
- 131 deterministic recipes;
- nine semantic categories;
- iPhone-first single-column interface;
- two explicit experiment slots plus one Combine action;
- categories appear only when the player owns something in them;
- search stays hidden until the collection is large enough to need it;
- discovery memory appears only after the player has actually discovered something;
- new concepts can immediately become the next experiment;
- fast repeated partner testing keeps Concept A loaded after a combination;
- browser-local save data;
- one-way migration of valid v0.1 discoveries when possible;
- no account, telemetry, runtime AI or paid API calls.

The graph is provisional playtest content rather than released production canon. It is hand-authored and validated for unique unordered pairs, full starter reachability and reverse-pair symmetry.

## Current design goal

First Light should become deep through the graph itself rather than through an added metagame.

The main content priorities are coherent categories, intuitive or retrospectively defensible recipes, converging paths, cross-category relationships and late discoveries that make earlier concepts interesting again. Raw concept count is not the goal.

The previous public Operational Chain / Metamyne mechanic test has been removed from the deployed surface. That research remains preserved privately for possible future use; it is not part of the current First Light product direction.

## Deployment boundary

The private development repository `Doodle-God-Exp` remains separate. This public repository exposes only the standalone game and necessary deterministic runtime modules.

`.github/workflows/pages.yml` packages an explicit allowlist:

- `index.html`
- `app.mjs`
- `seed.mjs`
- `dist/core/resolveRecipe.js`
- `.nojekyll`

The deployment workflow validates JavaScript syntax, 100-concept reachability, recipe symmetry, self-pair behavior and a known no-reaction case before publishing.

## Feedback

Useful feedback is concrete: one satisfying discovery, one arbitrary or confusing discovery, one moment of inventory friction, and whether a newly discovered concept naturally made you want to try another combination.

## Originality and access

A free original prototype, not affiliated with the creators of *Doodle God*. Publishing these game files makes them publicly inspectable; this does not grant access to the private development repository. No license is granted by default beyond rights provided by law.
