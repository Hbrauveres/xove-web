import type { Me } from "@services/xove-api-service";
import type { AuthState } from "@shared/stores/auth-store";
import type { RouteAccess, RouteRule } from "../types/route-access.types";

const SHOW: RouteAccess = { kind: "show" };
const goTo = (to: string): RouteAccess => ({ kind: "redirect", to });

/** Where a signed-in person belongs: members and admins in the room, anyone else at request access. */
const homeFor = (status: string, admin: boolean) => (status === "MEMBER" || admin ? "/room" : "/request-access");

/** For a signed-in person, each page's rule. */
const SIGNED_IN: Record<RouteRule, (me: Me) => RouteAccess> = {
  "signed-out": (me) => goTo(homeFor(me.status, me.admin)),
  member: (me) => (me.status === "MEMBER" ? SHOW : goTo("/request-access")),
  admin: (me) => (me.admin ? SHOW : goTo(homeFor(me.status, false))),
  "non-member": (me) => (me.status === "MEMBER" ? goTo("/room") : SHOW),
};

/**
 * Only decides which screen to show. The real protection is the API: every protected
 * endpoint checks the session itself.
 */
export function routeAccess(rule: RouteRule, state: AuthState): RouteAccess {
  if (state.status === "loading") return { kind: "loading" };
  if (state.status === "signedOut") return rule === "signed-out" ? SHOW : goTo("/");
  return SIGNED_IN[rule](state.me);
}
