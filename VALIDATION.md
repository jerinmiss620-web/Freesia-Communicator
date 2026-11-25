# Validation

## Repository-side checks

GitHub Actions runs `node scripts/verify-release.mjs` on pushes and pull requests. It checks:

- Stable, Test and Loader manifest schemas and project/channel identities.
- Fixed Commit URL, version path and manifest source path consistency.
- SHA-256 and UTF-8 byte-length equality for each published source.
- JavaScript syntax for Core, Loader Runtime and Bootstrap packages; four-route fallback and in-route integrity validation.
- Loader concurrent-check deduplication and per-route diagnostic fields.
- Bootstrap import JSON validity and exact equality between its embedded script and the standalone Bootstrap source.
- Exact equality of the Core, Loader and Bootstrap ancestor host-resolver functions, including a nested-frame simulation.
- Loader and Bootstrap Shadow DOM root detection against a simulated open Shadow DOM.
- Bootstrap success criteria require a Loader-managed Core whose actual version matches the Loader's active version.

## Current baseline

The v0.3.22 release remains the Stable baseline. Core v0.3.24 is on the Test channel. Repository checks do not replace real PC, Android and iPhone/TavernTogether testing; do not promote to Stable before those tests pass.

| Component | Version | Repository validation |
|---|---:|---|
| Core Stable | 0.3.22 | Unchanged |
| Core Test | 0.3.24 | Manifest + SHA-256 + UTF-8 length configured |
| Loader Runtime | 0.1.3 | Manifest + SHA-256 + UTF-8 length configured; Shadow DOM / host resolver tests |
| Bootstrap | 1.0.2 | Import package + standalone source configured; shared host resolver and Shadow DOM checks |

## Not yet validated on devices

The repository-side checks do not prove successful execution inside Tavern Helper. Before announcing a public Stable migration, test:

- PC desktop viewport.
- PC browser with a narrow/mobile viewport.
- Android browser / SillyTavern.
- iPhone / TavernTogether.
- Re-import Bootstrap 1.0.2 over the existing 1.0.1 installation; confirm the existing IndexedDB caches remain readable.
- Test Core v0.3.24 installation and actual runtime version after Shadow DOM health check.
- Refresh and offline cache restore.
- A Test Core upgrade followed by an explicit rollback to Stable.
- Existing chat messages, moments, comments, subscriptions and settings after migration.

Do not describe these device tests as passed until they have been performed.
