import type { ReactNode } from "react";

export interface StatPillProps {
  /** What leads the number: the people's faces, or an icon where faces can't show. */
  lead: ReactNode;
  count: number;
  /** What the number counts, said to screen readers after it ("watching"). */
  unit: string;
}
