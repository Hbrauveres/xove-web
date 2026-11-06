import type { AriaRole } from "react";
import type { IconName } from "../../../types/icon.types";

export interface MenuRowProps {
  icon: IconName;
  /** What it does, in words: shown, and its name. */
  label: string;
  /** Goes to a page: the row is a link. */
  to?: string | undefined;
  /** Does something here: the row is a button. */
  onPick?: (() => void) | undefined;
  /** Why it can't be used now: dimmed, said in its tooltip and, on a click, in a toast. */
  unavailable?: string | undefined;
  /** Set by the menu it's in: `menuitem` in a menu, none in a dialog. */
  role?: AriaRole | undefined;
}
