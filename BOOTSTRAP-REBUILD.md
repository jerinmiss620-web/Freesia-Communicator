# Freesia Messenger Bootstrap rebuild — isolated test branch

Branch: `test-bootstrap-rebuild-verify` (PR #6 validation head)

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
- Stable Core manifest: `latest.json` (v0.3.37; minimum Loader 0.1.6 retained for legacy CI)
- Loader manifest: `loader/test-latest.json` (v0.1.8; isolated test pointer)
- Static validation: `scripts/verify-bootstrap-rebuild.mjs`
- Workflow: `.github/workflows/validate-bootstrap-rebuild.yml`

## Remaining validation

1. Install the disabled test package in a disposable ST / TT test profile and verify the actual Tavern Helper lifecycle, script enable/disable behavior, and single-instance ownership.
2. Verify on iPhone Safari / TT that IndexedDB reconnect, page refresh, offline recovery, the close button, and re-entry all behave correctly.
3. Confirm the user's existing chat metadata, settings, and phone data remain intact through a real migration.
4. Do not promote to Stable until those real-device checks pass.

## Reference implementation

- TLE Bootstrap: `jerinmiss620-web/Tavern-Layout-Engine/loader/bootstrap/TLE-Permanent-Bootstrap-1.0.6.js`
- TLE Loader: `jerinmiss620-web/Tavern-Layout-Engine/loader/runtime/v0.3.6/TLE-Remote-Loader.js`
- TLE full-chain test: `jerinmiss620-web/Tavern-Layout-Engine/tests/tle-update-chain.test.mjs`

## CI results

All three GitHub Actions workflows pass on the current validation head:

- `Validate Messenger Bootstrap rebuild`: syntax, full-source replay, existing Core release checks, and Bootstrap / Loader / Core manifest consistency.
- `Validate Remote Bootstrap and Loader`: legacy release integrity and migration contracts.
- `Validate Freesia Messenger releases`: Core source hash, byte length, and ESM import package integrity.

The full-source replay now explicitly passes:
- first install and transient manifest retry;
- unattended Core and Loader updates without re-importing the permanent entry;
- failed Loader upgrade rollback and failed Core initialization rollback;
- auto-update off/on behavior;
- offline restoration from IndexedDB;
- corrupt source rejection and stale-version downgrade prevention;
- durable LKG write failure;
- pending-request destruction without resurrection;
- v1.0.5 Bootstrap / v0.1.6 Loader cache migration, including choosing a newer verified localStorage LKG over a stale IndexedDB record;
- IndexedDB lost-connection invalidation, reopen, and one retry;
- Test / Stable channel isolation and switching back.

These are repository-level automated results, not iPhone, TT, or ST real-device acceptance. The test importer remains disabled by default and has not been promoted to Stable.
