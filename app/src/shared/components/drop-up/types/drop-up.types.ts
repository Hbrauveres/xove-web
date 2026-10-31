import type { ReactNode } from "react";

export interface DropUpProps {
  /** Its name for screen readers. */
  label: string;
  /** Only while its stream is live. */
  enabled: boolean;
  /** The round button it belongs to; a click on it does what it always does. */
  trigger: ReactNode;
  /** Whether it's open, for a drop-up told from outside; without it, it keeps its own. */
  open?: boolean | undefined;
  /** Told when it opens or closes. */
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** Its width, when not the usual 228 px. */
  width?: number;
  /**
   * Another panel already shows these controls (the settings): resting the mouse calls this instead of
   * opening, and nothing opens over the button.
   */
  redirect?: (() => void) | undefined;
  children: ReactNode;
}
