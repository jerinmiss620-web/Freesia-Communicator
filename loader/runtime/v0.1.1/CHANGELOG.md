# Remote Loader v0.1.1

- Add TestingCF as the fourth transport route alongside GitHub Raw, jsDelivr and Fastly.
- Prefer GitHub Raw for mutable Stable/Test manifests; use CDN mirrors for immutable commit-pinned source files.
- Validate each response before accepting it. Invalid JSON, manifest identity/path mismatches, UTF-8 byte-length mismatches and SHA-256 mismatches now advance to the next route.
- Keep the canonical manifest source URL pinned to the repository and immutable commit. Mirrors only transport bytes.
- Preserve IndexedDB Candidate, Last Known Good, Previous and rollback behavior. No Core business code or storage schema changes.
