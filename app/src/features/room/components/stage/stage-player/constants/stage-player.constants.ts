/** How long the player's labels and bars stay after the mouse stops moving. */
export const CHROME_IDLE_MS = 2500;
/** The settings over the cog sit this far above the round buttons, in px. */
export const ROW_GAP = 10;
/** What holds the controls up while it's open: a menu, the settings. */
export const HOLD_MENU = "menu";
export const HOLD_SETTINGS = "settings";

/** The small view's fold: one short move into the corner button, and back out of it. */
export const FOLD_MS = 220;
/** The app's ease-out (--ease-out), for the browser's own animation. */
export const FOLD_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

/**
 * The narrowest picture the small view fits on, in px: room for its Swap and Hide (two M buttons,
 * 4 px apart, 6 px in) at the picture's whole width. On a narrower one, it folds by itself.
 */
export const SMALL_VIEW_MIN = 84;
/** What the pointer may rest on in the player that keeps its controls up: a control, or a menu of one. */
export const RESTS_ON = "button, input, [role='menu']";
