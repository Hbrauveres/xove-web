import type { HTMLAttributes, ReactNode } from "react";

/**
 * Each page's frame:
 * - home: the sign-in page, its column wider, a red glow at the top
 * - form: a page with a form in its column (Request access)
 * - waiting: the waiting room, its card and what's under it centred
 * - message: one short line while something loads
 */
type PageShellVariant = "home" | "form" | "waiting" | "message";

export interface PageShellProps extends HTMLAttributes<HTMLElement> {
  variant: PageShellVariant;
  /** The column's heading, by id: home and form only. */
  labelledBy?: string | undefined;
  children: ReactNode;
}
