import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import type { IconName } from "@shared/types/icon.types";

export interface ActionPillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** m (34 px) over a stream; l (44 px) where it's the main thing to do. */
  size: "m" | "l";
  /** glass over a stream, red for the first way, soft for the second. */
  fill: "glass" | "red" | "soft";
  /** What leads the words: an icon, or the live dot. */
  lead?: IconName | "dot" | undefined;
  /** Can't be used now (it says why in its tooltip): faded, and disabled for assistive tech. */
  unavailable?: boolean | undefined;
  ref?: Ref<HTMLButtonElement> | undefined;
  children: ReactNode;
}
