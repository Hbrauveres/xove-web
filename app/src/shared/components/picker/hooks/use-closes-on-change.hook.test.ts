import { fireEvent, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useClosesOnChange } from "./use-closes-on-change.hook";

it("closes when the options change or the window resizes while open, not on mounting", () => {
  const close = vi.fn();
  const { rerender } = renderHook(({ key }) => useClosesOnChange(close, key, true), { initialProps: { key: "a" } });
  expect(close).not.toHaveBeenCalled();
  rerender({ key: "b" });
  expect(close).toHaveBeenCalledTimes(1);
  fireEvent(window, new Event("resize"));
  expect(close).toHaveBeenCalledTimes(2);
});
