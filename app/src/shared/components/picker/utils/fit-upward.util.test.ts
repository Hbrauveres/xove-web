import { expect, it, vi } from "vitest";
import { fitUpward } from "./fit-upward.util";

it("is no taller than the room above it, and has no limit without room", () => {
  const picker = document.createElement("div");
  const list = document.createElement("div");
  const box = vi.spyOn(picker, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 208, 100, 40));
  fitUpward(list, picker);
  expect(list.style.maxHeight).toContain("200px");
  box.mockReturnValue(new DOMRect(0, 0, 100, 40));
  fitUpward(list, picker);
  expect(list.style.maxHeight).toBe("");
});
