# Freesia Messenger Remote Loader v0.1.9

- Promotes the verified IndexedDB-primary Candidate / Last Known Good / Previous cache lifecycle from the v0.1.8 test runtime.
- Keeps verified IndexedDB writes and readback for Core candidate staging and rollback records.
- Migrates existing Messenger localStorage source records only after the IndexedDB copy is verified.
- Preserves the reconnect-on-lost-connection behavior: invalidate stale DB handles, reopen once, retry once, then report failure without deleting cached data.
- Preserves Messenger Core API identity, localStorage preference keys, and chat/user data.
- Routes Stable updates to `main/latest.json` and the optional Test channel to `main/channels/test.json`; no Stable URL points to the test branch.
- Requires Permanent Bootstrap v1.0.8 or newer.

## Migration

- Bootstrap 1.0.8 checks the remote Loader before executing a cached Loader.
- A verified local Loader cache is used only as an offline fallback, and a remote Loader older than that verified cache is rejected.
- The existing runtime is allowed to finish its current operation before replacement; a busy Loader is never forcibly interrupted.
