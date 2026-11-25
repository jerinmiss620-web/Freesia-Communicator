# Release Procedure

## Active Core release: GitHub ESM Import

The active installation path uses a tiny Tavern Helper JSON whose `content` is one static ES Module import statement. The complete Core remains on GitHub.

1. Create a new immutable source file at `core/vX.Y.Z/Freesia-Messenger.js`. Never overwrite an existing version directory.
2. Keep business storage keys, chat metadata schema, instance ID and Prompt ID unchanged unless a deliberate migration is designed and tested.
3. Set the Core API version, startup log and visible version labels to the same release version.
4. Commit the immutable source file first. Record that exact commit SHA, immutable raw URL, SHA-256 and UTF-8 byte length in `core/vX.Y.Z/release.json`.
5. Make `core/current/Freesia-Messenger.js` byte-for-byte identical to the immutable versioned source.
6. Create a versioned Tavern Helper JSON entry. Its `content` must be a single static `import 'https://.../core/current/Freesia-Messenger.js'` statement. Preserve the existing script ID. Do not add a dynamic-import wrapper, cache-busting code, Bootstrap or Remote Loader.
7. Update the changelog, README and `scripts/verify-release.mjs`. Validate the source snapshot/current equality, hash, byte length, Core syntax, exact importer content and business storage keys.
8. Merge the release to `main`. Existing users retain the same import entry; future Core updates happen on GitHub and are picked up after refreshing Tavern. Users do not repeatedly download or import JSON.
9. On Stable pushes, purge the jsDelivr cache for `core/current/Freesia-Messenger.js` and verify that `testingcf.jsdelivr.net` actually serves the expected Core version. Do not call a release delivered until this CDN check passes.

The active ESM-import path does not consume `latest.json` or `channels/test.json`; those remain legacy Remote Loader manifests. Do not add Bootstrap or Remote Loader back into the current loading path.

## Legacy Remote Loader records

For historical Remote Loader releases only:

1. Create an immutable source file under `core/vX.Y.Z/`.
2. Preserve business storage keys, chat metadata and Prompt ID unless a tested migration is intended.
3. Set the Core API version to the release version.
4. Commit the source first and pin its commit SHA.
5. Record SHA-256 and exact UTF-8 byte length.
6. Update `channels/test.json` and complete real ST/TT testing before Stable promotion.
7. Publish the same tested source commit/hash/version to `latest.json`.

## Loader Runtime / Bootstrap

The historical `loader/` and `bootstrap/` directories are retained for reference. They are not part of the active ESM-import path and must not be reintroduced into the current installer.

## Version policy

Core versions are monotonically increasing. Do not publish different source bytes under the same version number. A release publishes an immutable Core snapshot, a matching `core/current` alias and a tiny static-import Tavern Helper entry.
