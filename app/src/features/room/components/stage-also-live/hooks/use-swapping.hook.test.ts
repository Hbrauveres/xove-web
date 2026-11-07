import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { onFakeClock } from "@testing/factories/clock.factory";
import { SWAP_MS } from "../constants/stage-also-live.constants";
import { useSwapping } from "./use-swapping.hook";

it("plays a swap for a moment, then lets it go", () => {
  onFakeClock();
  const { result } = renderHook(() => useSwapping());
  act(() => result.current[1]("user-2"));
  expect(result.current[0]).toBe("user-2");
  act(() => vi.advanceTimersByTime(SWAP_MS));
  expect(result.current[0]).toBeNull();
});
