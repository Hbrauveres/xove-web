/** Who a page is for: members, admins, signed-in people who aren't members yet, or signed-out visitors. */
export type RouteRule = "member" | "admin" | "non-member" | "signed-out";

import type { AuthState } from "@shared/stores/auth-store";

/**
 * What to do for a page: show it, wait for the API's answer, send the person elsewhere, or say it can't
 * tell who's signed in.
 */
export type RouteAccess =
  | { kind: "show" }
  | { kind: "loading" }
  | { kind: "redirect"; to: string }
  | { kind: "cantReach"; state: Extract<AuthState, { status: "unreachable" | "failed" }> };
