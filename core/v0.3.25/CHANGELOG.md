# Freesia Messenger · v0.3.25

## Window controller rebuild

- Replaced the legacy window visibility and floating-entry event flow with a dedicated `WindowController`, following the interaction model used by Freesia Regex Manager v1.3.6.
- The draggable floating bubble is now the single window entry. It appears while Messenger is enabled and its window is closed or minimized; clicking it opens or restores the window.
- PC window: centered responsive workspace, title-bar dragging, bottom-right resizing, maximize/restore, and remembered geometry.
- Mobile viewport at 821px and below: full-screen window. Layout follows `visualViewport` resize and scroll changes and retains the existing safe-area handling.
- Desktop and mobile window geometry and bubble positions are stored separately. Previous window and bubble coordinates are migrated when no new geometry exists.
- Restored unread-count badge updates on the floating bubble.
- Removed the duplicated extension-drawer controls for opening the window, enabling Messenger, and showing/hiding the bubble. The drawer now has one dynamic enable/disable control. AI preset management remains inside Messenger → Settings.

## Preserved

- Existing chat, moments, subscriptions, community, preset, privacy-mask, and message-sync data structures and storage keys.
- Existing real-time awareness, proactive contact, story-sync, backup/import, API test, and diagnostic functions.
- Closing or minimizing the window does not disable Messenger or stop proactive scheduling. The extension drawer's **关闭通讯侠** action disables the runtime and hides the bubble; **启用通讯侠** re-enables it and opens the window.

## Validation

- JavaScript source compilation check passed.
- Static checks confirm the new controller, the 821px breakpoint, the draggable/resizable window, the single enable/disable control, and removal of the old duplicated entry controls.
- This is a Test-channel release. PC SillyTavern, TavernTogether, and iPhone viewport behavior still require real-device verification before any Stable promotion.
