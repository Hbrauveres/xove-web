import type { RefObject } from "react";
import type { MyMenuData } from "../../../types/my-menu.types";

export interface HeaderMyMenuProps extends MyMenuData {
  open: boolean;
  /** What it opens under: my picture. */
  anchor: RefObject<HTMLElement | null>;
  onClose: () => void;
}
