import type { ReactNode } from "react";
import type { RouteRule } from "./route-access.types";

export type RouteGuardProps = { rule: RouteRule; children: ReactNode };
