# Remote Loader Runtime v0.1.3

## Core v0.3.24 compatibility

- Uses the exact ancestor host resolver used by Communicator Core v0.3.24; Bootstrap, Loader and Core now agree on the same host window and document.
- Health checks recognize both the legacy document-root layout and the v0.3.24 open Shadow DOM root under `#freesia-messenger-root-host`.
- A successful Core load is no longer rejected merely because its root lives inside Shadow DOM.
- Detects and retires a previous Bootstrap-managed Loader still registered on the immediate parent window during the host-resolver migration; a live Test Loader still blocks Stable startup.

## Compatibility and safety

- Requires Permanent Bootstrap 1.0.2 because Bootstrap must use the same host resolver and Shadow DOM-aware Core health check.
- Preserves the existing Loader IndexedDB database, cache slots, localStorage keys, Core business storage and rollback data.
- Retains four-route download fallback, SHA-256 / UTF-8 length validation, script SRI / verified Blob fallback, Candidate / Last Known Good / Previous and rollback.
