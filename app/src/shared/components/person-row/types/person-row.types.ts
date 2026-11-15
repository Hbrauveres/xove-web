import type { ReactNode } from "react";

export interface PersonRowProps {
  /** Their `Face`, at the size the place gives it. */
  face: ReactNode;
  /** A quiet word above the name, saying what the row is ("Signed in as"). */
  label?: ReactNode;
  /** Who: their name, or their email when that's what identifies them. */
  name: ReactNode;
  /** A quiet line under the name: their email, their role, what they're doing. */
  line?: ReactNode;
  /** What ends the row: a time, a button, a badge, icons. */
  end?: ReactNode;
  /** Its place, set by what holds it. */
  className?: string | undefined;
}
