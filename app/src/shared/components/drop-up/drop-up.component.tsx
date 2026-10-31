import type { CssVars } from "@shared/types/css-vars.types";
import { useDropUp } from "./hooks/use-drop-up.hook";
import styles from "./drop-up.component.module.css";
import type { DropUpProps } from "./types/drop-up.types";

/**
 * Quick access over a live round button: resting the mouse on the button unrolls one frosted
 * pill above it, centred, after a short pause; moving up into it keeps it open (the gap is
 * bridged); leaving closes it, even right after a click, with a short grace for a slip. The
 * keyboard's focus opens it too. A click still does what the button does. Nothing unrolls over what
 * the person opened themselves (a panel).
 */
export function DropUp({ label, enabled, trigger, open: told, onOpenChange, width, redirect, children }: DropUpProps) {
  const { open, root, handlers } = useDropUp({ enabled, open: told, onOpenChange, redirect });
  const style: CssVars | undefined = width ? { "--dropup-width": `${width}px` } : undefined;

  // Always the same wrapper around the button, so it keeps the keyboard's focus when its
  // stream starts or stops; only the drop-up and its handlers come and go.
  if (!enabled) {
    return (
      <div className={styles.wrap}>
        <div className={styles.trigger} data-dropup-trigger>
          {trigger}
        </div>
      </div>
    );
  }

  return (
    <div ref={root} className={styles.wrap} data-dropup data-open={open} {...handlers}>
      <div className={styles.trigger} data-dropup-trigger>
        {trigger}
      </div>
      <fieldset className={styles.dropup} aria-label={label} inert={!open || undefined} style={style}>
        {children}
      </fieldset>
    </div>
  );
}
