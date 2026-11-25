# Release Procedure

## Core release

1. Create a new immutable source file: `core/vX.Y.Z/Freesia-Messenger.js`. Never overwrite an older version directory.
2. Keep the existing business storage keys, chat metadata schema and Prompt ID unless a deliberate migration is designed and tested.
3. Correct the Core API `version` to match the release version.
4. Commit the source file first; copy that commit SHA into the manifest.
5. Compute SHA-256 over the exact UTF-8 source bytes and record the exact UTF-8 byte length.
6. Update `channels/test.json` first. Test the source in real ST/TT environments.
7. After validation, publish the same source commit/hash/version to `latest.json` (Stable).

## Loader Runtime release

1. Add `loader/runtime/vX.Y.Z/Freesia-Messenger-Remote-Loader.js`.
2. Commit the source, calculate SHA-256 and UTF-8 byte length.
3. Update `loader/latest.json` with the pinned source Commit and hash.
4. Keep the Bootstrap protocol backward-compatible. If not, release a new Bootstrap import package and migration guide.

## Bootstrap release

Bootstrap is the fixed local entry point. Only replace it when the loader startup protocol must change. When replacing it, add a new versioned `.js` and `.json` pair; update the JSON package's embedded `content` to match the standalone JS exactly. Existing installations must import the new Bootstrap once because an installed Bootstrap cannot update itself.

## Transport fallback policy\n\n- Four routes: GitHub Raw, jsDelivr, Fastly and TestingCF.\n- Mutable branch manifests prefer GitHub Raw; immutable commit-pinned source files try CDN routes before GitHub Raw.\n- Network/timeout/HTTP errors and response validation errors all advance to the next route. Validation includes manifest JSON/schema/project/channel/version/path, UTF-8 byte length and SHA-256.\n- Mirrors are transport only; the canonical `source_url` remains the fixed GitHub Raw URL with an immutable Commit.\n- Exhausting all routes leaves the currently running version and verified rollback caches untouched.\n\n## Version policy

Core versions are monotonically increasing across Stable and Test. Do not publish different source bytes under the same version number. Test starts from the current Stable baseline and advances ahead; promotion copies the exact tested commit and hash into Stable.
