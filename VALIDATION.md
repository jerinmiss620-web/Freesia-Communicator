# Validation

## Active Stable GitHub ESM Import Core

| Item | Value |
|---|---|
| Current Core | **v0.3.36** |
| Release branch | `main` |
| Immutable source | `core/v0.3.36/Freesia-Messenger.js` |
| Current alias | `core/current/Freesia-Messenger-ESM.js` |
| Tavern Helper entry | `install/Freesia-Messenger-GitHub-ESM-Import-v0.3.36.json` |
| Original script ID | `6ba49b66-ace8-4db4-acbd-292b6dde4ced` |
| Immutable source commit | `4b1fa89a5e14dc926d7b0e1d6cb16a97663d2498` |
| Source SHA-256 | `557fa079b326d8720bc7831faaa16d765ed9e02d422dc4e147606a260a087f92` |
| UTF-8 byte length | `371989` |

## Repository-side validation

- The `core/current/Freesia-Messenger-ESM.js` alias is byte-for-byte identical to the immutable v0.3.36 source.
- The release manifest pins the immutable source commit, raw URL, SHA-256 and exact UTF-8 byte length.
- Core API version, visible version labels and startup log match v0.3.36.
- The Tavern Helper JSON preserves the original script ID and contains exactly one static ES Module import statement pointing to the fresh `main/core/current/Freesia-Messenger-ESM.js` alias.
- The complete Core remains on GitHub; the import JSON contains no Core implementation, dynamic import wrapper, Bootstrap, Remote Loader or IndexedDB loader.
- JavaScript syntax is checked with Node's `vm.Script`.
- Stable GitHub Actions purges the jsDelivr cache and verifies that the actual `testingcf.jsdelivr.net` import URL returns the expected Core version before the CDN check passes.
- The previous `Freesia-Messenger.js` CDN alias was observed returning v0.3.30 despite the GitHub `main` source being v0.3.36; the new alias is used to avoid that stale cache.
- Phone CSS is inserted only into the phone Shadow DOM; the non-Shadow-DOM fallback keeps the style inside the isolated root host.
- The document-level stylesheet is separately scoped to `#freesia-messenger-extension` and contains no checkbox/input appearance rules.
- The phone's internal checkbox/radio rule remains inside its private stylesheet.
- The frame has no CSS `max-width` cap or redundant mobile `max-width:none` override. PC sizing remains JS-clamped to 520px; mobile sizing uses Visual Viewport bounds.
- iOS keyboard safe-area handling and the dismissible retry notice remain present.
- Business storage keys match the v0.3.35 Core.

## Device validation status

Repository validation is not a substitute for real Tavern testing. The v0.3.36 source passed the TEST branch's source-level validation before promotion. The following Stable device checks must still be confirmed in the actual environment:

- iPhone Safari opening PC-hosted SillyTavern: full-screen width reaches both viewport edges without the 16px offset.
- iPhone software keyboard: bottom safe-area gap closes while the keyboard is open and returns after it closes.
- iPhone / TavernTogether.
- PC: portrait window, dragging, resizing, minimize-to-bubble and restore.
- Android browser / SillyTavern.
- Extension foldout: checkboxes retain the Tavern theme's native appearance; phone internal controls remain visually independent.

Do not describe these device checks as passed until they have been performed.
