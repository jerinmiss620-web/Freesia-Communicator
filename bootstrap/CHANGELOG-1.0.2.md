# Permanent Bootstrap v1.0.2

- Uses the same ancestor host resolver as Communicator Core v0.3.24, so Bootstrap, Loader and Core share one host window/document.
- Detects the Core root in either the legacy document tree or the v0.3.24 open Shadow DOM under `#freesia-messenger-root-host`.
- Startup success now requires the Loader-managed Core instance and matching runtime version; a stale standalone Core can no longer mask a failed update.
- Cleans up legacy Bootstrap/Loader/Core instances stored on the previous immediate parent window during the host-resolver migration.
- Preserves the existing Bootstrap IndexedDB name/store and Loader cache layout.
