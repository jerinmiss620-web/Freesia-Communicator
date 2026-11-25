# Validation

## Active Stable GitHub ESM Import Core

| Item | Value |
|---|---|
| Current Core | **v0.3.37** |
| Release branch | `main` |
| Immutable source | `core/v0.3.37/Freesia-Messenger.js` |
| Current alias | `core/current/Freesia-Messenger-ESM.js` |
| Tavern Helper entry | `install/Freesia-Messenger-GitHub-ESM-Import-v0.3.37.json` |
| Original script ID | `6ba49b66-ace8-4db4-acbd-292b6dde4ced` |
| Immutable source commit | `0f318507aee98489c3e4a621fed1636841727cd0` |
| Source SHA-256 | `15274a9985c701c069c4dd38ccdde17cc501828e85ec49a04331817689ad6b7d` |
| UTF-8 byte length | `372230` |

## Repository-side validation

- Current alias and immutable v0.3.37 snapshot must be byte-for-byte identical.
- Release manifest pins immutable source commit, raw URL, SHA-256 and UTF-8 byte length.
- Core API version, visible labels and startup log must all report v0.3.37.
- Import JSON preserves the original script ID and contains exactly one static ES Module import to the existing ESM alias.
- The retry notice contains a close button, a delegated click handler and the persisted `retryNoticeDismissed` flag.
- The close button has a 28×28px target and its SVG has explicit visible stroke styling; this is checked both in source validation and in the actual CDN response.
- The close action only dismisses the notice. It does not delete the failed user message or automatically retry it.
- JavaScript syntax is checked with Node's `vm.Script`.
- Phone and extension styles remain isolated; existing storage keys are compared with v0.3.36.
- Stable GitHub Actions purges jsDelivr and verifies the actual CDN response before delivery is considered complete.

## Device validation status

Repository and CDN checks are not a substitute for device testing. The following must still be confirmed in the actual Tavern environment:

- iPhone: close icon is visibly rendered and tapping it removes the retry notice.
- After closing, navigate away and back: the notice remains dismissed.
- Reload SillyTavern: the dismissed state remains saved.
- Tapping `重试回复` still retries the corresponding failed message.
- PC / TT: the same close action works.

Do not describe these device checks as passed until they have been performed.
