# Freesia Messenger Bootstrap rebuild — isolated test branch

Branch: `test-bootstrap-rebuild`

## Scope

Rebuild the existing Permanent Bootstrap / Remote Loader chain using the proven TLE Permanent Bootstrap 1.0.6 + Stable Remote Loader 0.3.6 implementation as the behavioral reference. This remains a two-layer architecture: the permanent Bootstrap manages the Remote Loader; the Loader manages the Messenger Core.

## Compatibility constraints

- Preserve the existing Stable Tavern Helper script ID `4f6c8f70-8e7d-4a2f-9b8e-1c4a6d2f9b30` for the eventual Stable replacement.
- The isolated test importer has its own ID and imports disabled by default.
- Preserve Messenger Core API identity `__FREESIA_MESSENGER_V1__`, root IDs, business storage keys, chat metadata, presets, and user settings.
- Keep Test and Stable channels isolated.
- Never clear Tavern/site data or replace a healthy Core before a verified rollback copy exists.
- Do not publish test artifacts to `main` or claim iPhone/TT acceptance based on repository tests.

## Confirmed release mismatch

At the start of the work, Stable `latest.json` pointed to Core v0.3.22, while the verified current Core and ESM import entry were v0.3.37. The Test manifest pointed to v0.3.29. Thus the Bootstrap/Loader Stable chain and ESM import entry did not describe the same Core release.

This branch's Stable manifest now points to the verified immutable Core v0.3.37 source:
- Commit: `0f318507aee98489c3e4a621fed1636841727cd0`
- SHA-256: `15274a9985c701c069c4dd38ccdde17cc501828e85ec49a04331817689ad6b7d`
- UTF-8 bytes: `372230`

## Implemented on this branch

### Bootstrap 1.0.6 TEST

- Reads the Loader manifest from this test branch, not `main`.
- Fetches mutable manifests from GitHub Raw first; immutable sources remain Commit-pinned and SHA-256 verified.
- Adds a fixed-Commit rollback source for legacy Loader v0.1.6 and test Loader v0.1.7.
- Ports TLE's IndexedDB lifecycle: version-change/close invalidation, reconnect-on-lost-connection, one retry, and verified write/readback.
- Migrates existing Messenger Bootstrap v1.0.5 localStorage cache records only after validation; the old localStorage records are retained as compatibility copies.
- Preserves the existing Bootstrap cache key namespace and Messenger host/Core identities.

### Remote Loader 0.1.8 TEST

- Ports TLE Stable Loader 0.3.6's IndexedDB-primary Candidate / Last Known Good / Previous cache protocol.
- Verifies IndexedDB writes by reading the record back and checking version, byte length, and SHA-256.
- Migrates existing v0.1.6 / v0.1.7 localStorage source records only after the IndexedDB copy is verified.
- Stores a small localStorage pointer after successful persistence; falls back to a full localStorage source record only when IndexedDB cannot be opened.
- Retains reconnect-and-retry behavior without deleting the existing cache on connection loss.
- Preserves Messenger's Core API, localStorage preference keys, and business data.

### Test artifacts

- Import package (disabled by default): `install/Freesia-Messenger-Permanent-Bootstrap-1.0.6-TEST.json`
- Bootstrap source: `bootstrap/Freesia-Communicator-Permanent-Bootstrap-1.0.6-TEST.js`
- Loader source: `loader/runtime/v0.1.8/Freesia-Messenger-Remote-Loader.js`
- Stable Core manifest: `latest.json` (v0.3.37)
- Loader manifest: `loader/latest.json` (v0.1.8)
- Static validation: `scripts/verify-bootstrap-rebuild.mjs`
- Workflow: `.github/workflows/validate-bootstrap-rebuild.yml`

## Remaining validation

1. Run the new workflow and correct any syntax, manifest, hash, size, or package mismatch it reports.
2. Add a complete Bootstrap → Loader → Core replay test using real repository sources. Cover first install, transient network errors, refresh recovery, Core and Loader upgrades, offline restart, corrupted source rejection, IndexedDB disconnect/reconnect, storage write failure, rollback, channel isolation, and destruction during pending work.
3. Only after repository tests pass, provide the disabled test package for ST / TT / iPhone real-device acceptance.
4. Do not promote to Stable until the actual iPhone / TT checks pass.

## Reference implementation

- TLE Bootstrap: `jerinmiss620-web/Tavern-Layout-Engine/loader/bootstrap/TLE-Permanent-Bootstrap-1.0.6.js`
- TLE Loader: `jerinmiss620-web/Tavern-Layout-Engine/loader/runtime/v0.3.6/TLE-Remote-Loader.js`
- TLE full-chain test: `jerinmiss620-web/Tavern-Layout-Engine/tests/tle-update-chain.test.mjs`

## CI follow-up

- The first replay run confirmed that all three JavaScript sources parse and that the replay dependencies install.
- The first harness assertion incorrectly expected the Core style element in the host document; the Core intentionally mounts its visual stylesheet inside the Messenger Shadow DOM. The assertion now checks the Shadow DOM, matching the actual Core architecture.
- The replay suite is being rerun against the corrected assertion. A separate legacy workflow still asserts the old Loader v0.1.6 manifest and is not the new rebuild verifier; it must be reconciled before any Stable merge.
