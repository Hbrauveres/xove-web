import type { AriaRole } from "react";
import type { IconName } from "../../../types/icon.types";

interface MenuRowBase {
  icon: IconName;
  /** What it does, in words: shown, and its name. */
  label: string;
  /** Set by the menu it's in: `menuitem` in a menu, none in a dialog. */
  role?: AriaRole | undefined;
}

/** Goes to a page: the row is a link. */
interface MenuRowLink extends MenuRowBase {
  to: string;
  onPick?: never;
  unavailable?: never;
}

/** Does something here: the row is a button. */
interface MenuRowButton extends MenuRowBase {
  to?: never;
  onPick: () => void;
  /** Why it can't be used now: dimmed, said in its tooltip and, on a click, in a toast. */
  unavailable?: string | undefined;
}

export type MenuRowProps = MenuRowLink | MenuRowButton;
