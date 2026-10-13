# Roadmap

- v0.3 Foundation: save-key migration, pack seam, graph report, itch build, README cleanup.
- v0.4 Content pass: zero dead ends, second paths, depth preserved, CI tightened.
- v0.5 Player features: hint, feedback export, completion moment, discovery sound + mute.
- v1.0 Volume 1 release (Ethan): itch.io page, upload the build, pay-what-you-want pricing,
  20 outside playtesters, collect their feedback exports, then one v1.0.x patch for the
  top confusions.
- Gate for Volume 2: at least half of playtesters reach 50+ concepts, and some ask for more.
- Volume 2 (later): a new pack with its own content, colors, button styles and sounds;
  its own build and store page; engine unchanged. Decide then whether it starts fresh or
  builds on Volume 1.
- Not planned until after Volume 1: accounts, cloud saves, runtime AI, leaderboards,
  daily or meta modes, app store builds.

## Decisions

- 2026-10-12: Use minimum recipe layers for the depth gate (starters = 0;
  result = 1 + the deeper input, minimized across recipes). Also report distinct
  prerequisites in the shallowest recipe tree, with deterministic tie-breaking,
  before and after the content pass. This extra column is report-only.
