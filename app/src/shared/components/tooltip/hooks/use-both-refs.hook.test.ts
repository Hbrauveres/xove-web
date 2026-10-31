import { renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useBothRefs } from "./use-both-refs.hook";

it("fills both refs", () => {
  const mine = { current: null };
  const theirs = vi.fn();
  const { result } = renderHook(() => useBothRefs(mine, theirs));
  const el = document.createElement("button");
  result.current(el);
  expect(mine.current).toBe(el);
  expect(theirs).toHaveBeenCalledWith(el);
});
