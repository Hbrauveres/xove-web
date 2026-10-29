/** Who a page is for: members, admins, signed-in people who aren't members yet, or signed-out visitors. */
export type RouteRule = "member" | "admin" | "non-member" | "signed-out";

/** What to do for a page: show it, wait for the API's answer, or send the person elsewhere. */
export type RouteAccess = { kind: "show" } | { kind: "loading" } | { kind: "redirect"; to: string };
