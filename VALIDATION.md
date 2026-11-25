# Validation

## Active GitHub Direct Import Core

| Item | Value |
|---|---|
| Current Core | **v0.3.35** |
| Immutable source | `core/v0.3.35/Freesia-Messenger.js` |
| Current alias | `core/current/Freesia-Messenger.js` |
| Import package | `install/Freesia-Messenger-GitHub-Direct-v0.3.35.json` |
| Original script ID | `6ba49b66-ace8-4db4-acbd-292b6dde4ced` |
| Source SHA-256 | `e1f0957b21808fe4bfa8b10aa40be078e9c052ff84b5e0f2ad9060d25ffc554b` |
| UTF-8 byte length | `371619` |

The direct-import release validator checks:

- The current alias is byte-for-byte identical to the immutable versioned source.
- The release manifest points to the source commit and immutable raw URL.
- SHA-256 and exact UTF-8 byte length match the source bytes.
- Core API version, visible version labels and startup log match the release version.
- The installer JSON preserves the original script ID and dynamically imports the GitHub `core/current` entry.
- JavaScript syntax and the direct-parent Tavern host contract.
- Mobile keyboard safe-area handling, mobile `max-width` reset and dismissible retry notice are present.
- Extension-menu controls are not styled by the phone window's private control rules.
- Existing business storage keys match the previous direct-import Core release.

## Legacy Remote Loader records

`latest.json` and `channels/test.json` remain historical manifests for the retired Remote Loader route. The current GitHub Direct installer does not consult them. Permanent Bootstrap and Remote Loader are not required by the active direct-import path.

## Device validation status

Repository validation is not a substitute for real device testing. The v0.3.35 source has passed source-level syntax and structural checks, but the final iPhone behavior still needs confirmation in the actual Tavern environment, especially:

- iPhone Safari opening PC-hosted SillyTavern: full-screen edge-to-edge geometry.
- iPhone software keyboard: bottom gap closes while the keyboard is open and the normal Home Indicator safe area returns after it closes.
- iPhone / TavernTogether.
- PC desktop portrait window, manual resize and maximize.
- Android browser / SillyTavern.

Do not describe these device checks as passed until they have been performed.
