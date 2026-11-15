import type { HTMLAttributes, ReactNode } from "react";

/**
 * Each page's frame:
 * - home: the sign-in page, its column wider, a red glow at the top
 * - form: a page with a form in its column (Request access)
 * - waiting: the waiting room, its card and what's under it centred
 * - message: one short line while something loads
 * - wide: a page of lists, from the top, in a wide column (admin)
 */
type PageShellVariant = "home" | "form" | "waiting" | "message" | "wide";

export interface PageShellProps extends HTMLAttributes<HTMLElement> {
  variant: PageShellVariant;
  /** A wide page's bar (its header), above its main region: wide only. */
  bar?: ReactNode;
  /** The column's heading, by id: home and form only. */
  labelledBy?: string | undefined;
  children: ReactNode;
}
