import { Navigate } from "react-router";
import { useAuth } from "@shared/stores/auth-store";
import { FullPageMessage } from "../../components/ui/FullPageMessage";
import type { RouteGuardProps } from "./types/route-guard.types";
import { routeAccess } from "./utils/route-access.util";

/** Shows its page only to the people `rule` allows; sends anyone else where they belong. */
export function RouteGuard({ rule, children }: RouteGuardProps) {
  const access = routeAccess(rule, useAuth().state);
  if (access.kind === "loading") return <FullPageMessage>Loading…</FullPageMessage>;
  if (access.kind === "redirect") return <Navigate to={access.to} replace />;
  return <>{children}</>;
}
