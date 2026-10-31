import { fireEvent, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { usePickerKeys } from "./use-picker-keys.hook";

it("an arrow opens it when closed; other keys do nothing", () => {
  const el = document.body.appendChild(document.createElement("div"));
  const setOpen = vi.fn();
  renderHook(() => usePickerKeys({ current: el }, { open: false, up: false, setOpen }));
  fireEvent.keyDown(el, { key: "Tab" });
  expect(setOpen).not.toHaveBeenCalled();
  fireEvent.keyDown(el, { key: "ArrowDown" });
  expect(setOpen).toHaveBeenCalledWith(true);
});
