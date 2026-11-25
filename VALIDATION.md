# Validation

## Repository-side checks

GitHub Actions runs `node scripts/verify-release.mjs` on pushes and pull requests. It checks:

- Stable, Test and Loader manifest schemas and project/channel identities.
- Fixed Commit URL, version path and manifest source path consistency.
- SHA-256 and UTF-8 byte-length equality for each published source.
- JavaScript syntax for Core, Loader Runtime and Bootstrap.
- Bootstrap import JSON validity and exact equality between its embedded script and the standalone Bootstrap source.

## Current baseline

The v0.3.22 release remains the Stable baseline. Core v0.3.23 implements the four agreed mobile/UI fixes on the Test channel. Repository checks do not replace real PC, Android and iPhone/TavernTogether testing; do not promote to Stable before those tests pass.

| Component | Version | Repository validation |
|---|---:|---|
| Core Stable | 0.3.22 | Unchanged |
| Core Test | 0.3.23 | Manifest + SHA-256 + UTF-8 length configured |
| Loader Runtime | 0.1.0 | Manifest + SHA-256 + UTF-8 length configured |
| Bootstrap | 1.0.0 | Import package + standalone source configured |

## Not yet validated on devices

The repository-side checks do not prove successful execution inside Tavern Helper. Before announcing a public Stable migration, test:

- PC desktop viewport.
- PC browser with a narrow/mobile viewport.
- Android browser / SillyTavern.
- iPhone / TavernTogether.
- First install with the old full script disabled.
- Refresh and offline cache restore.
- A Test Core upgrade followed by an explicit rollback to Stable.
- Existing chat messages, moments, comments, subscriptions and settings after migration.

Do not describe these device tests as passed until they have been performed.
