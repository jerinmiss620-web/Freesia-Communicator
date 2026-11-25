# Freesia Messenger Remote Loader 0.1.8 — Bootstrap rebuild test

- Ports TLE Stable Loader 0.3.6 IndexedDB-primary Candidate / Last Known Good / Previous persistence.
- Adds verified IndexedDB writes and readback for Core candidate staging and rollback records.
- Migrates existing Messenger 0.1.6 / 0.1.7 localStorage source records only after the IndexedDB copy is verified.
- Stores only a small localStorage pointer after IndexedDB persistence; keeps localStorage fallback only when IndexedDB cannot be opened.
- Retains the TLE reconnect-on-lost-connection behavior: invalidate stale DB handles, reopen once, retry once, then report failure without deleting cached data.
- Preserves Messenger Core API identity, localStorage preference keys, and chat/user data.
- Test branch only; not a Stable release.
