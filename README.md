# First Light — Volume 1

A deterministic concept-combination discovery game for quick mobile play. Discover all 100 concepts, starting with six. Progress stays in your browser: no accounts, telemetry, runtime AI, or API calls.

**[Play First Light](https://episode5.github.io/first-light-playtest/)**

## Development

Use Node 22 or newer. Run `npm ci`, `npm test`, and `npm run graph`.
Serve this directory with any static HTTP server to play locally.

`node scripts/build-itch.mjs --pack volume-1` produces
`build/first-light-volume-1/index.html` and `build/first-light-volume-1.zip`.
The zip has one self-contained `index.html` at its root. All dependencies are dev-only.

## Pack boundary

`packs/volume-1/content.mjs` owns concepts, starters, recipes, graph version and category labels.
`pack.mjs` owns identity, save namespace, share link and the discovery sound manifest.
`theme.css` owns CSS custom properties and all visual styling, including buttons.
`active-pack.mjs` selects the Pages pack. `seed.mjs` preserves existing CI imports.
The deterministic resolver is unchanged.

A future separately released pack can copy this directory, supply its own content,
theme and manifest, then build with `--pack <id>`. For Pages, select it in
`active-pack.mjs` and update the explicit deployment allowlist. No engine changes,
pack picker or unlock system are required. Future pack save namespaces must be unique;
only Volume 1 imports the two prototype save keys.

Discovery depth means minimum recipe layers from starters: starters = 0, result =
`1 + max(input depths)`, minimized over recipes. The report-only prerequisite count
follows each concept's shallowest recipe recursively, breaking ties by sorted input
pair then recipe ID in code-point order. It counts distinct prerequisites including
starters, excluding the target itself; shared branches count once. This is a review
signal, not a gate or an exact minimum number of Combine actions.

Saves migrate one way from both earlier versions, unioning valid discoveries.
Legacy keys remain untouched. A valid current save takes precedence so Reset stays reset.
If browser storage is unavailable, play continues for the current session.

## Deployment and review

PRs run graph validation and the itch build. Only `main` deploys through
`.github/workflows/pages.yml`, which publishes an explicit runtime allowlist and
checks its file count. Source docs, scripts, tests and tooling never enter that artifact.
The roadmap is in `docs/ROADMAP.md`; future decisions are appended with dates.

## Originality and access

First Light contains original, hand-authored concepts and recipe content.
Publishing these files makes the game inspectable. No license is granted by default
beyond rights provided by law.
