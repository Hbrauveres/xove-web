import type { ReactNode, RefObject } from "react";

export interface DropdownProps {
  open: boolean;
  /** Closes it: told by a press outside, by Escape (which also returns focus to its button), or by another opening. */
  onClose: () => void;
  /** Its button's wrapper: a press there isn't "outside". */
  anchor: RefObject<HTMLElement | null>;
  /** Its name for screen readers. */
  label: string;
  /** "menu" for a list of actions (account), "dialog" for a panel of content (activity, people). */
  role?: "menu" | "dialog";
  /** Under the end of its button (the right side), or centred under it. */
  align?: "end" | "center";
  className?: string | undefined;
  /** Its width, when not the usual 340 px. */
  width?: number;
  children: ReactNode;
}
