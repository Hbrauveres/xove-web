import { vi } from "vitest";
import type { SmallViewFold } from "@features/room/types/small-view.types";

/** The small view's fold, open unless said otherwise, every action a spy. */
export const aFold = (over: Partial<SmallViewFold> = {}): SmallViewFold => ({
  folded: false,
  hide: vi.fn(),
  show: vi.fn(),
  setBox: vi.fn(),
  setHide: vi.fn(),
  setCorner: vi.fn(),
  ...over,
});
