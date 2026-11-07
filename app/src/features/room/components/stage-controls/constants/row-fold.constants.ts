import type { FoldKey } from "../types/row-fold.types";

/**
 * The order the bar's buttons fold into "…" when the picture is too narrow for them. Fullscreen, my
 * mic and my own screen and camera never fold (ADR-0096).
 */
export const FOLD_ORDER: readonly FoldKey[] = ["settings", "go-live", "sound", "voice"];

/*
 * The sizes the row is measured with: the stylesheet's tokens (the round buttons' two sizes,
 * --control-sm and --control-3xl; the gaps, --space-*), in px at the app's 16 px root.
 */
/** An M round button, "…" and the fullscreen button included (--control-sm). */
export const M = 34;
/** An L round button, my own (--control-3xl). */
export const L = 48;
/** From the picture's edge to the controls (--space-3). */
export const EDGE = 12;
/** Between the bar's buttons (--space-2). */
export const BAR_GAP = 8;
/** Between the bar and the fullscreen button (--space-2-5). */
export const BAR_TO_FULLSCREEN = 10;
/** Between my own L buttons (--space-2-5), and my M ones (--space-1-5). */
export const OWN_GAP_L = 10;
export const OWN_GAP_M = 6;
/** Between my own row and the fullscreen button beside it (--space-2). */
export const OWN_TO_FULLSCREEN = 8;
/** Go live's pill before it's been measured. */
export const GO_LIVE_GUESS = 92;
