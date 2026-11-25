# Validation

## Active GitHub ESM Import Core

| Item | Value |
|---|---|
| Current Core | **v0.3.35** |
| Immutable source | `core/v0.3.35/Freesia-Messenger.js` |
| Current alias | `core/current/Freesia-Messenger.js` |
| Tavern Helper entry | `install/Freesia-Messenger-GitHub-ESM-Import-v0.3.35.json` |
| Original script ID | `6ba49b66-ace8-4db4-acbd-292b6dde4ced` |
| Source SHA-256 | `e1f0957b21808fe4bfa8b10aa40be078e9c052ff84b5e0f2ad9060d25ffc554b` |
| UTF-8 byte length | `371619` |

The ESM-import release validator checks:

- The current alias is byte-for-byte identical to the immutable versioned source.
- The release manifest pins the source commit, immutable raw URL, SHA-256 and exact UTF-8 byte length.
- Core API version, visible version labels and startup log match the release version.
- The Tavern Helper JSON preserves the original script ID and contains only the static ES Module import statement pointing to GitHub `core/current`.
- The importer does not embed Core code, a dynamic import wrapper, Bootstrap, Remote Loader or IndexedDB loader.
- Core JavaScript syntax and the direct-parent Tavern host contract.
- Mobile keyboard safe-area handling, mobile `max-width` reset and dismissible retry notice are present.
- Extension-menu controls are not styled by the phone window's private control rules.
- Existing business storage keys match the previous Core release.

## Legacy Remote Loader records

`latest.json` and `channels/test.json` remain historical manifests for the retired Remote Loader route. The active GitHub ESM import entry does not consult them. Permanent Bootstrap and Remote Loader are not required by the active loading path.

## Device validation status

Repository validation is not a substitute for real device testing. The v0.3.35 source has passed source-level syntax and structural checks, but the final iPhone behavior still needs confirmation in the actual Tavern environment, especially:

- iPhone Safari opening PC-hosted SillyTavern: full-screen edge-to-edge geometry.
- iPhone software keyboard: bottom gap closes while the keyboard is open and the normal Home Indicator safe area returns after it closes.
- iPhone / TavernTogether.
- PC desktop portrait window, manual resize and maximize.
- Android browser / SillyTavern.

Do not describe these device checks as passed until they have been performed.
