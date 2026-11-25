# Validation

## Repository-side checks

GitHub Actions runs `node scripts/verify-release.mjs` on pushes and pull requests. It checks:

- Stable, Test and Loader manifest schemas and project/channel identities.
- Fixed Commit URL, version path and manifest source path consistency.
- SHA-256 and UTF-8 byte-length equality for each published source.
- JavaScript syntax for Core, Loader Runtime and Bootstrap packages; four-route fallback and in-route integrity validation.
- Loader concurrent-check deduplication and per-route diagnostic fields.
- Bootstrap import JSON validity and exact equality between its embedded script and the standalone Bootstrap source.
- Direct-parent host contract and Shadow DOM root detection for Core, Loader and Bootstrap.
- Loader and Bootstrap Shadow DOM root detection against a simulated open Shadow DOM.
- Bootstrap success criteria verify the Loader runtime and wait for its startup promise before Core adoption.

## Current baseline

The v0.3.22 release remains the Stable baseline. Core v0.3.29 is on the Test channel. Repository checks do not replace real PC, Android and iPhone/TavernTogether testing; do not promote to Stable before those tests pass.

| Component | Version | Repository validation |
|---|---:|---|
| Core Stable | 0.3.22 | Unchanged |
| Core Test | 0.3.29 | Manifest + SHA-256 + UTF-8 length; PC portrait geometry and mobile full-screen assertions |
| Loader Runtime | 0.1.5 | Manifest + SHA-256 + UTF-8 length; localStorage-first rollback cache and legacy IndexedDB fallback-read checks |
| Bootstrap | 1.0.4 | Import package + standalone source; localStorage-only cache and missing-LKG adoption checks |

## Not yet validated on devices

The repository-side checks do not prove successful execution inside Tavern Helper. Before announcing a public Stable migration, test:

- PC desktop viewport: default window approximately 420×780px, remains portrait-shaped, and does not expand to a 920–1120px wide panel.
- PC manual resize and maximize remain capped at 520px wide.
- PC browser with a narrow/mobile viewport.
- Android browser / SillyTavern.
- iPhone Safari opening the PC-hosted SillyTavern.
- iPhone / TavernTogether.
- Replace Bootstrap 1.0.3 with 1.0.4; confirm Bootstrap and Loader write/read back verified localStorage cache records, while old IndexedDB databases remain untouched.
- Test Core v0.3.26 installation and actual runtime version after Shadow DOM health check.
- Refresh and offline restore from localStorage cache; confirm IndexedDB connection loss no longer blocks startup.
- A Test Core upgrade followed by an explicit rollback to Stable.
- Existing chat messages, moments, comments, subscriptions and settings after migration.

Do not describe these device tests as passed until they have been performed.
