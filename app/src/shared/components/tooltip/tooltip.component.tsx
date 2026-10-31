import { cloneElement, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useBothRefs } from "./hooks/use-both-refs.hook";
import { useTip } from "./hooks/use-tip.hook";
import styles from "./tooltip.component.module.css";
import type { TooltipProps } from "./types/tooltip.types";
import { triggerProps } from "./utils/trigger-props.util";

/**
 * The app's one tooltip: a short text over a control, said with a mouse or the
 * keyboard. A finger gets none (a tap leaves a control "hovered"); a greyed-out control says why in
 * the toast instead. It floats on its own layer, above its control or below where there's no room,
 * never clipped. One floating thing at a time: it replaces another tooltip or what opened on a mouse
 * rest, and something opening closes it; it never closes what the person opened.
 */
export function Tooltip({ text, children, hidden = false }: TooltipProps) {
  const anchor = useRef<HTMLElement | null>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const id = useId();
  const { shown, show, hide, rest } = useTip({ tip, anchor, quiet: !text || hidden, text });
  // Its own ref and the control's own, both.
  const ref = useBothRefs(anchor, children.props.ref);
  const props = triggerProps(children.props, { id, text, hidden, rest, show, hide });
  return (
    <>
      {cloneElement(children, { ...props, ref })}
      {text &&
        createPortal(
          <span ref={tip} id={id} role="tooltip" className={styles.tip} data-shown={shown || undefined}>
            {text}
          </span>,
          // In the browser's fullscreen only the fullscreen element is drawn: it floats there.
          document.fullscreenElement ?? document.body,
        )}
    </>
  );
}
