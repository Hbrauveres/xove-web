import type { ButtonHTMLAttributes, ReactElement, ReactNode, Ref } from "react";

/**
 * Where the button sits, each with its own look:
 * - player: the player's round buttons (screen, camera, mic, settings), each in a glass pill
 * - stage: the round glass buttons over a stream
 * - overlay: the fullscreen corner, over the empty stage
 * - toggle: a sound's small round toggle
 * - header: the header's clear pill buttons
 * - words: a small pill with words, in the settings' own style (Change, Test)
 */
type IconButtonVariant = "player" | "stage" | "overlay" | "toggle" | "header" | "words";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: IconButtonVariant;
  ref?: Ref<HTMLButtonElement> | undefined;
  /** The player's pill: lit, for a stream that's live. */
  live?: boolean | undefined;
  /** The player's pill: faded, for a button that can't be used now (it says why in its tooltip). */
  unavailable?: boolean | undefined;
  /** The player's pill: what it opens is open. */
  open?: boolean | undefined;
  /** The player's pill: what wraps the button inside it (its tooltip). */
  around?: ((button: ReactElement<object>) => ReactNode) | undefined;
  children: ReactNode;
}
