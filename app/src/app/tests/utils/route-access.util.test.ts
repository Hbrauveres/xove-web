import { describe, expect, it } from "vitest";
import { aUser } from "../../../test/fakeApi";
import type { AuthState } from "@core/auth/types/auth.types";
import { routeAccess } from "../../utils/route-access.util";

const signedIn = (overrides: Parameters<typeof aUser>[0] = {}): AuthState => ({
  status: "signedIn",
  me: aUser(overrides),
});

describe("which page a person may open", () => {
  it("waits while the API hasn't said who is signed in, whatever the page", () => {
    for (const rule of ["member", "admin", "non-member", "signed-out"] as const) {
      expect(routeAccess(rule, { status: "loading" })).toEqual({ kind: "loading" });
    }
  });

  it("sends signed-out people home from every signed-in page, and shows them the home page", () => {
    for (const rule of ["member", "admin", "non-member"] as const) {
      expect(routeAccess(rule, { status: "signedOut" })).toEqual({ kind: "redirect", to: "/" });
    }
    expect(routeAccess("signed-out", { status: "signedOut" })).toEqual({ kind: "show" });
  });

  it("keeps the room for members, and sends anyone else to request access", () => {
    expect(routeAccess("member", signedIn({ status: "MEMBER" }))).toEqual({ kind: "show" });
    for (const status of ["NONE", "PENDING", "DECLINED"] as const) {
      expect(routeAccess("member", signedIn({ status }))).toEqual({ kind: "redirect", to: "/request-access" });
    }
  });

  it("keeps the admin page for admins, and sends others where they belong", () => {
    expect(routeAccess("admin", signedIn({ status: "MEMBER", admin: true }))).toEqual({ kind: "show" });
    expect(routeAccess("admin", signedIn({ status: "NONE", admin: true }))).toEqual({ kind: "show" });
    expect(routeAccess("admin", signedIn({ status: "MEMBER", admin: false }))).toEqual({
      kind: "redirect",
      to: "/room",
    });
    expect(routeAccess("admin", signedIn({ status: "PENDING", admin: false }))).toEqual({
      kind: "redirect",
      to: "/request-access",
    });
  });

  it("keeps request access for people who aren't members, and sends members to the room", () => {
    for (const status of ["NONE", "PENDING", "DECLINED"] as const) {
      expect(routeAccess("non-member", signedIn({ status }))).toEqual({ kind: "show" });
    }
    expect(routeAccess("non-member", signedIn({ status: "MEMBER" }))).toEqual({ kind: "redirect", to: "/room" });
  });

  it("sends signed-in people from the home page to where they belong, an admin to the room", () => {
    expect(routeAccess("signed-out", signedIn({ status: "MEMBER" }))).toEqual({ kind: "redirect", to: "/room" });
    expect(routeAccess("signed-out", signedIn({ status: "NONE", admin: true }))).toEqual({
      kind: "redirect",
      to: "/room",
    });
    expect(routeAccess("signed-out", signedIn({ status: "NONE" }))).toEqual({
      kind: "redirect",
      to: "/request-access",
    });
  });
});
