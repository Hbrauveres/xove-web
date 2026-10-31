import type { FocusEvent, PointerEvent, ReactElement, Ref, RefObject } from "react";

export type TooltipTrigger = ReactElement<{
  ref?: Ref<HTMLElement>;
  onPointerEnter?: (e: PointerEvent<HTMLElement>) => void;
  onPointerLeave?: (e: PointerEvent<HTMLElement>) => void;
  onPointerDown?: (e: PointerEvent<HTMLElement>) => void;
  onFocus?: (e: FocusEvent<HTMLElement>) => void;
  onBlur?: (e: FocusEvent<HTMLElement>) => void;
  "aria-describedby"?: string | undefined;
  "aria-label"?: string;
}>;

export interface TooltipProps {
  text?: string | undefined;
  children: TooltipTrigger;
  /** Told to keep quiet (a drop-up open over the control). */
  hidden?: boolean | undefined;
}

export interface TipOptions {
  tip: RefObject<HTMLElement | null>;
  anchor: RefObject<HTMLElement | null>;
  /** Nothing to say, or told to keep quiet: gone. */
  quiet: boolean;
  text: string | undefined;
}
