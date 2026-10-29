import { renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { installFakeApi } from "../../test/fakeApi";
import { AuthProvider } from "./auth.store";
import { useAuth } from "./use-auth.hook";

describe("useAuth", () => {
  it("gives the provider's state and actions", () => {
    installFakeApi({ me: null });
    const wrapper = ({ children }: { children: ReactNode }) => createElement(AuthProvider, null, children);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.state).toEqual({ status: "loading" });
    expect(typeof result.current.signOut).toBe("function");
  });

  it("says where it's missing when used outside the provider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(/inside <AuthProvider>/);
  });
});
