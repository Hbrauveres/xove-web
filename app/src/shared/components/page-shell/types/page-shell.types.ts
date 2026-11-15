import type { HTMLAttributes, ReactNode } from "react";

interface PageShellBase extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

/**
 * Each page's frame:
 * - home: the sign-in page, its column wider, a red glow at the top
 * - form: a page with a form in its column (Request access)
 * - waiting: the waiting room, its card and what's under it centred
 * - message: one short line while something loads
 * - wide: a page of lists, from the top, in a wide column (admin), its bar above its main region
 */
export type PageShellProps =
  | (PageShellBase & {
      variant: "home" | "form";
      /** The column's heading, by id. */
      labelledBy?: string | undefined;
      bar?: never;
    })
  | (PageShellBase & { variant: "waiting" | "message"; labelledBy?: never; bar?: never })
  | (PageShellBase & {
      variant: "wide";
      /** The page's bar (its header), above its main region. */
      bar: ReactNode;
      labelledBy?: never;
    });
