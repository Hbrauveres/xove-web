import type { ReactNode } from "react";

export interface StageBarMenuProps {
  /** `menu` for a list of actions (Go live's); `group` where it also holds sliders ("…"), a fieldset. */
  kind: "menu" | "group";
  id?: string | undefined;
  "aria-label"?: string | undefined;
  /**
   * Centred on the picture rather than ending at its button's right ("…", on a narrow picture: it
   * reaches past both sides equally). Its holder must then not be positioned: it's placed in the bar.
   */
  centred?: boolean | undefined;
  /** Centred over its own button rather than ending at its right (the empty stage's Go live). */
  overButton?: boolean | undefined;
  /** Its rows; an `<hr />` between groups. */
  children: ReactNode;
}
