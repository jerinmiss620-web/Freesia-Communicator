# Freesia Messenger Remote Loader 0.1.7 — Bootstrap rebuild test

- Isolated test runtime cloned from the existing Messenger Remote Loader 0.1.6.
- Stable and Test manifests resolve from the `test-bootstrap-rebuild` branch.
- Mutable branch manifests are requested from GitHub Raw before CDN mirrors; immutable Commit-pinned source remains hash-verified.
- Existing Core API, localStorage cache keys, IndexedDB legacy-read compatibility, and user data keys are unchanged.
- Not a Stable release; requires the test Bootstrap 1.0.6 package.
