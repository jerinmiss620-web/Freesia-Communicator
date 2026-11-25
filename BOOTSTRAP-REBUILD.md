# Freesia Messenger Bootstrap rebuild — test branch

Branch: `test/bootstrap-rebuild`

## Scope

Rebuild the existing Permanent Bootstrap / Remote Loader chain by using the proven TLE Permanent Bootstrap 1.0.6 + Stable Remote Loader 0.3.6 implementation as the behavioral reference. This is a two-layer architecture; the Remote Loader is retained.

## Non-negotiable compatibility

- Preserve Tavern Helper script ID `4f6c8f70-8e7d-4a2f-9b8e-1c4a6d2f9b30`.
- Preserve Messenger Core API identity `__FREESIA_MESSENGER_V1__`, root IDs, existing storage keys, chat metadata, and user settings.
- Keep one permanent Bootstrap import; Loader and Core are remote, versioned runtimes.
- Keep Test and Stable channels isolated.
- Never clear Tavern/site data or overwrite a healthy Core before a verified rollback copy exists.
- Do not publish a test artifact to `main` or claim iPhone/TT acceptance based on repository tests.

## Confirmed repository inconsistency

At the start of this branch, the repository's Stable `latest.json` still pointed to Core v0.3.22, while the verified current Core release and ESM import entry were v0.3.37. The Test manifest pointed to v0.3.29. This means Bootstrap/Loader Stable and the ESM entry did not describe the same Core release.

This branch changes only its own Stable manifest to the already verified v0.3.37 immutable source:
- Commit: `0f318507aee98489c3e4a621fed1636841727cd0`
- SHA-256: `15274a9985c701c069c4dd38ccdde17cc501828e85ec49a04331817689ad6b7d`
- UTF-8 bytes: `372230`

## Implementation sequence

1. Port the TLE Bootstrap 1.0.6 lifecycle and its IndexedDB reconnect behavior, while preserving the existing Messenger Bootstrap cache as a read-only migration source.
2. Port the TLE Stable Loader 0.3.6 update, health-check, Candidate / LKG / Previous, and rollback protocol to Messenger's Core API and storage namespace. Preserve compatibility with existing Loader 0.1.6 records and Core versions.
3. Add a complete Bootstrap → Loader → Core replay test using the real repository sources. Cover install, refresh recovery, upgrade, offline, transient network failures, corrupt source, IndexedDB disconnect/reconnect, storage failure, rollback, channel isolation, and destruction during pending work.
4. Run syntax, manifest, SHA-256, UTF-8 size, package ID/content, and full update-chain tests.
5. Only after repository tests pass, produce a test JSON for ST / TT / iPhone real-device acceptance. No Stable promotion before that acceptance.

## Reference implementation

- TLE Bootstrap: `jerinmiss620-web/Tavern-Layout-Engine/loader/bootstrap/TLE-Permanent-Bootstrap-1.0.6.js`
- TLE Loader: `jerinmiss620-web/Tavern-Layout-Engine/loader/runtime/v0.3.6/TLE-Remote-Loader.js`
- TLE full-chain test: `jerinmiss620-web/Tavern-Layout-Engine/tests/tle-update-chain.test.mjs`

