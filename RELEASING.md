# Release Procedure

## Active Core release: GitHub Direct Import

The active installation path is documented in `README.md`: the Tavern Helper script is a small dynamic-import entry point, while the complete Core lives on GitHub.

1. Create a new immutable source file at `core/vX.Y.Z/Freesia-Messenger.js`. Never overwrite an existing version directory.
2. Keep business storage keys, chat metadata schema, instance ID and Prompt ID unchanged unless a deliberate migration is designed and tested.
3. Set the Core API version, startup log and visible version labels to the same release version.
4. Commit the immutable source file first. Record that exact commit SHA, immutable raw URL, SHA-256 and UTF-8 byte length in `core/vX.Y.Z/release.json`.
5. Make `core/current/Freesia-Messenger.js` byte-for-byte identical to the immutable versioned source.
6. Add a versioned GitHub Direct installer JSON for new installations. Preserve the existing script ID and dynamic import of `@main/core/current`. Existing installations do not need to re-import it.
7. Update the changelog, README and `scripts/verify-release.mjs`. The repository validation must check the versioned/current equality, source hash and byte length, JavaScript syntax, importer contract and business storage keys.
8. Merge the release to `main`. Existing users receive the new Core through their existing direct-import entry point after refresh.

The current direct-import path does not consume `latest.json` or `channels/test.json`; those are retained as legacy Remote Loader manifests and must not be treated as the direct-import release source. Do not add Bootstrap or Remote Loader back into the current direct-import path.

## Legacy Remote Loader Core release

For the historical Remote Loader path only:

1. Create an immutable source file under `core/vX.Y.Z/`.
2. Preserve business storage keys, chat metadata and Prompt ID unless a tested migration is intended.
3. Set the Core API version to the release version.
4. Commit the source first and pin its commit SHA.
5. Record SHA-256 and exact UTF-8 byte length.
6. Update `channels/test.json` and complete real ST/TT testing before Stable promotion.
7. Publish the same tested source commit/hash/version to `latest.json`.

## Loader Runtime release

1. Add `loader/runtime/vX.Y.Z/Freesia-Messenger-Remote-Loader.js`.
2. Commit the source, calculate SHA-256 and UTF-8 byte length.
3. Update `loader/latest.json` with the pinned source commit and hash.
4. Keep the Bootstrap protocol backward-compatible. If not, release a new Bootstrap import package and migration guide.

## Bootstrap release

Bootstrap is the fixed local entry point for the legacy Remote Loader path. Only replace it when the loader startup protocol must change. When replacing it, add a new versioned `.js` and `.json` pair; update the JSON package's embedded `content` to match the standalone JS exactly. Existing installations must import the new Bootstrap once because an installed Bootstrap cannot update itself.

## Transport fallback policy

- Four routes: GitHub Raw, jsDelivr, Fastly and TestingCF.
- Mutable branch manifests prefer GitHub Raw; immutable commit-pinned source files try CDN routes before GitHub Raw.
- Network/timeout/HTTP errors and response validation errors all advance to the next route. Validation includes manifest JSON/schema/project/channel/version/path, UTF-8 byte length and SHA-256.
- Mirrors are transport only; the canonical `source_url` remains the fixed GitHub Raw URL with an immutable commit.
- Exhausting all routes leaves the currently running version and verified rollback caches untouched.

## Version policy

Core versions are monotonically increasing. Do not publish different source bytes under the same version number. A direct-import release is promoted by publishing its immutable source and matching `current` alias on `main`; legacy Test/Stable manifests remain separate from that active path.
