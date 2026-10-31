import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { usePicker } from "./use-picker.hook";

const OPTIONS = [
  { value: "a", label: "First" },
  { value: "b", label: "Second" },
];

it("the chosen isn't among the others, and picking closes it and says so", () => {
  const onChange = vi.fn();
  const { result } = renderHook(() => usePicker({ label: "Camera", options: OPTIONS, value: "a", onChange }, false));
  expect(result.current.others.map((o) => o.value)).toEqual(["b"]);
  act(() => result.current.setOpen(true));
  act(() => result.current.pick("b"));
  expect(result.current.open).toBe(false);
  expect(onChange).toHaveBeenCalledWith("b");
});
