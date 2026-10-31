import type { FocusEvent, PointerEvent } from "react";
import type { TooltipTrigger } from "../types/tooltip.types";

interface TipActions {
  id: string;
  text: string | undefined;
  hidden: boolean;
  rest: () => void;
  show: () => void;
  hide: () => void;
}

/** What a tooltip adds to its control, keeping the control's own handlers. */
export function triggerProps(p: TooltipTrigger["props"], { id, text, hidden, rest, show, hide }: TipActions) {
  // Quiet or not, it describes its control: a screen reader hears what a drop-up hides. Unless it
  // only repeats the control's name, which would be heard twice.
  const describes = Boolean(text) && text !== p["aria-label"];
  return {
    "aria-describedby": describes ? [p["aria-describedby"], id].filter(Boolean).join(" ") : p["aria-describedby"],
    onPointerEnter: (e: PointerEvent<HTMLElement>) => {
      p.onPointerEnter?.(e);
      if (e.pointerType === "mouse" && text && !hidden) rest();
    },
    onPointerLeave: (e: PointerEvent<HTMLElement>) => {
      p.onPointerLeave?.(e);
      hide();
    },
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      p.onPointerDown?.(e);
      hide();
    },
    onFocus: (e: FocusEvent<HTMLElement>) => {
      p.onFocus?.(e);
      if (text && !hidden && e.currentTarget.matches(":focus-visible")) show();
    },
    onBlur: (e: FocusEvent<HTMLElement>) => {
      p.onBlur?.(e);
      hide();
    },
  };
}
