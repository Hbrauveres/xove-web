import { renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { useListSize } from "./use-list-size.hook";

it("gives the cue the list's height, nothing while closed", () => {
  const root = document.body.appendChild(document.createElement("div"));
  const list = root.appendChild(document.createElement("div"));
  const refs = [{ current: root }, { current: list }] as const;
  const { rerender } = renderHook((p) => useListSize(refs[0], refs[1], { ...p, up: true }), {
    initialProps: { open: true, drawn: true },
  });
  expect(root.style.getPropertyValue("--list-h")).toBe("0px");
  rerender({ open: false, drawn: true });
  expect(root.style.getPropertyValue("--list-h")).toBe("0px");
});
