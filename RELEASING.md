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

Bootstrap is the fixed local entry point. Only replace it when the loader startup protocol must change. Update the JSON package's embedded `content` to match the standalone JS exactly.

## Version policy

Core versions are monotonically increasing across Stable and Test. Do not publish different source bytes under the same version number. Test starts from the current Stable baseline and advances ahead; promotion copies the exact tested commit and hash into Stable.
