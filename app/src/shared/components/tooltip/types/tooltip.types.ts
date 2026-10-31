import type { FocusEvent, PointerEvent, ReactElement, Ref } from "react";

type TooltipTrigger = ReactElement<{
  ref?: Ref<HTMLElement>;
  onPointerEnter?: (e: PointerEvent<HTMLElement>) => void;
  onPointerLeave?: (e: PointerEvent<HTMLElement>) => void;
  onPointerDown?: (e: PointerEvent<HTMLElement>) => void;
  onFocus?: (e: FocusEvent<HTMLElement>) => void;
  onBlur?: (e: FocusEvent<HTMLElement>) => void;
  "aria-describedby"?: string;
  "aria-label"?: string;
}>;

export interface TooltipProps {
  text?: string | undefined;
  children: TooltipTrigger;
  /** Told to keep quiet (a drop-up open over the control). */
  hidden?: boolean | undefined;
}
