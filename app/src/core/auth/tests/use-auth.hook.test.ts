import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAuth } from "../use-auth.hook";

describe("useAuth", () => {
  it("says where it's missing when used outside the provider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(/inside <AuthProvider>/);
  });
});
