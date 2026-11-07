import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { GoLiveWidthContext, useGoLiveWidth } from "./use-go-live-width.hook";

describe("where Go live reports its width", () => {
  it("is what the stage offers", () => {
    const report = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <GoLiveWidthContext value={report}>{children}</GoLiveWidthContext>
    );
    expect(renderHook(() => useGoLiveWidth(), { wrapper }).result.current).toBe(report);
  });

  it("is nothing outside a stage", () => {
    expect(renderHook(() => useGoLiveWidth()).result.current).toBeNull();
  });
});
