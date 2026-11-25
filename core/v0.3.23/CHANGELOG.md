# Freesia Messenger Core v0.3.23 · Test

## Mobile launcher
- Move the floating launcher and Messenger window portal from `body` to `documentElement`, avoiding body-level transform/overflow clipping in narrow host layouts.
- Raise the launcher above mobile host navigation layers and explicitly isolate its dimensions, positioning, appearance, pointer events and gradient from host button/theme resets.
- Stop launcher clicks from bubbling into host-level handlers.
- Re-clamp saved launcher coordinates against the current visual viewport and respond to VisualViewport resize/scroll events. Dragging and position persistence remain intact.

## Responsive window
- Change the compact/full-screen breakpoint from 640px to 821px in both JavaScript and CSS.
- At widths up to 821px, use a true edge-to-edge frame with no outer padding, border or rounded card margins.
- Respect top and bottom safe areas inside the title bar and footer.

## Extension control center
- Separate three controls: enable/disable Messenger, open/close the phone window, and show/hide the floating ball.
- Disabling Messenger closes the window, hides the launcher, pauses proactive checks and clears the phone-story extension prompt. Re-enabling restores the prompt and proactive timer.
- Preserve all chat, moments, comments, subscriptions, AI presets, settings, existing storage keys and the fixed Prompt ID. No user content is deleted.
- Closing only the window does not stop proactive contact. Hiding the ball does not prevent opening Messenger from the extension drawer.

## Form-control isolation
- Strengthen the existing scoped form-control rules for the Messenger window and extension panel.
- Explicitly own color scheme, foreground, background shorthand, border image, focus-visible state, font rendering, autofill, selection, filters and transitions.
- Keep each control's local palette variables, native checkbox/radio behavior and disabled-state feedback.
- No host-theme variables or CSS classes are reused for Messenger text-entry styling.
