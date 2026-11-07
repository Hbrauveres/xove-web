import type { AriaRole, ReactNode } from "react";

export interface StageBarMenuProps {
  /** `menu` for a list of actions (Go live's); `group` where it also holds sliders ("…"). */
  role: AriaRole;
  id?: string | undefined;
  "aria-label"?: string | undefined;
  /** Its rows; an `<hr />` between groups. */
  children: ReactNode;
}
