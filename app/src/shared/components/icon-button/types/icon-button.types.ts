import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";

/** One of the app's two round sizes: l (48 px) for my own buttons, m (34 px) for every other. */
type RoundSize = "l" | "m";

/**
 * Every round button, on one base: glass with a soft shadow, lighter when pointed at, a red ring
 * for the keyboard, faded when unavailable, red when on. Only its icon changes.
 */
interface RoundProps {
  variant: "round";
  size: RoundSize;
  /** On: red, for a stream that's live or a mic that's on. */
  live?: boolean | undefined;
  /** Can't be used now (it says why in its tooltip): faded, and disabled for assistive tech. */
  unavailable?: boolean | undefined;
}

/**
 * The buttons that aren't round, each for another purpose:
 * - header: the header's clear pill buttons
 * - words: a small pill with words, in the settings' own style (Change, Test)
 * - close: a panel's close, clear until pointed at
 */
interface OtherProps {
  variant: "header" | "words" | "close";
  size?: never;
  live?: never;
  unavailable?: never;
}

export type IconButtonProps = (RoundProps | OtherProps) &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    ref?: Ref<HTMLButtonElement> | undefined;
    children: ReactNode;
  };
