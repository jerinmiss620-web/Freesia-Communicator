# Validation

## Test branch: GitHub ESM Import

| Item | Value |
|---|---|
| Test Core | **v0.3.36** |
| Test branch | `test-direct-esm-import` |
| Immutable source | `core/v0.3.36/Freesia-Messenger.js` |
| Current alias | `core/current/Freesia-Messenger.js` |
| Tavern Helper TEST entry | `install/Freesia-Messenger-GitHub-ESM-Import-TEST.json` |
| Original script ID | `6ba49b66-ace8-4db4-acbd-292b6dde4ced` |
| Source SHA-256 | `f6213976e23bdb15c40924331e4833a73f56caee92c4dde23375963a602c4039` |
| UTF-8 byte length | `371989` |

## Repository-side checks

- The current alias is byte-for-byte identical to the immutable v0.3.36 source.
- The release manifest pins the immutable source commit, raw URL, SHA-256 and exact UTF-8 byte length.
- Core API version, visible version labels and startup log match v0.3.36.
- The Tavern Helper TEST JSON preserves the original script ID and contains exactly one static ES Module import statement pointing to the test branch.
- The complete Core remains on GitHub; the import JSON contains no Core implementation, dynamic import wrapper, Bootstrap, Remote Loader or IndexedDB loader.
- JavaScript syntax is checked with Node's `vm.Script`.
- Phone CSS is inserted only into the phone Shadow DOM; the non-Shadow-DOM fallback keeps the style inside the isolated root host.
- The document-level stylesheet contains only selectors scoped to `#freesia-messenger-extension`; it has no checkbox/input appearance rules.
- The phone's internal checkbox/radio rule remains inside the phone stylesheet.
- The frame has no CSS `max-width` cap or redundant mobile `max-width:none` override. PC sizing remains JS-clamped to 520px; mobile sizing uses Visual Viewport bounds.
- iOS keyboard safe-area handling and the dismissible retry notice remain present.
- Business storage keys match the v0.3.35 Core.

## Legacy Remote Loader records

`latest.json` and `channels/test.json` remain historical records and are not used by the active ESM-import path.

## Device validation status

Repository checks do not replace real Tavern testing. Do not mark the following as passed until verified in the actual environment:

- iPhone Safari opening PC-hosted SillyTavern: full-screen width reaches both viewport edges without the 16px offset.
- iPhone software keyboard: bottom safe-area gap closes while the keyboard is open and returns after it closes.
- iPhone / TavernTogether.
- PC: portrait window, dragging, resizing, minimize-to-bubble and restore.
- Android browser / SillyTavern.
- Extension foldout: checkboxes retain the Tavern theme's native appearance; phone internal controls remain visually independent.
