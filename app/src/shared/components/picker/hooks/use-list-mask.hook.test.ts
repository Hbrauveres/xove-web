import { renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useListMask } from "./use-list-mask.hook";

function panel() {
  const host = document.body.appendChild(document.createElement("div"));
  host.setAttribute("data-list-host", "");
  const root = host.appendChild(document.createElement("div"));
  const list = root.appendChild(document.createElement("div"));
  const under = host.appendChild(document.createElement("div"));
  vi.spyOn(list, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 100, 100));
  vi.spyOn(under, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 50, 100, 20));
  return { root, list, under };
}

it("masks what's under the list while it's drawn, and lets it go after", () => {
  const { root, list, under } = panel();
  const refs = { root: { current: root }, list: { current: list }, down: true };
  const { rerender } = renderHook((p) => useListMask({ ...refs, ...p }), {
    initialProps: { open: true, drawn: true },
  });
  expect(under.style.maskImage).toContain("linear-gradient");
  rerender({ open: false, drawn: false });
  expect(under.style.maskImage).toBe("");
});
