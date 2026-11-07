import { expect, it, vi } from "vitest";
import { aSharer } from "@testing/factories/sharer.factory";
import { swapOf } from "./swap-of.util";

it("offers a swap only to someone sharing both, where the room can swap", () => {
  const onSwap = vi.fn();
  expect(swapOf(aSharer({ kinds: ["screen", "camera"] }), true, onSwap)).toEqual({ on: true, onSwap });
  expect(swapOf(aSharer({ kinds: ["screen"] }), false, onSwap)).toBeUndefined();
  expect(swapOf(aSharer({ kinds: ["screen", "camera"] }), false, undefined)).toBeUndefined();
});
