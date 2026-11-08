import { act, fireEvent, render } from "@testing-library/react";
import { createElement } from "react";
import { expect, it, vi } from "vitest";
import { useHeldGroup } from "./use-held-group.hook";

it("holds its element, hands it on, and stops holding once gone", () => {
  const resize = { now: () => {}, disconnected: false };
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(cb: () => void) {
        resize.now = cb;
      }
      observe() {}
      disconnect() {
        resize.disconnected = true;
      }
    },
  );
  const handed = vi.fn();
  function Row() {
    const { ref } = useHeldGroup<HTMLDivElement>(handed);
    return createElement("div", { ref, "data-testid": "row" }, createElement("button", null, "Camera"));
  }
  const { getByRole, getByTestId, unmount } = render(createElement(Row));
  expect(handed).toHaveBeenCalledWith(getByTestId("row"));
  const camera = getByRole("button");
  let left = 400;
  camera.getBoundingClientRect = () => DOMRect.fromRect({ x: left, y: 0, width: 48, height: 48 });
  fireEvent.pointerOver(camera);
  left = 409;
  act(() => resize.now());
  expect(getByTestId("row").style.transform).toBe("translateX(-9px)");
  unmount();
  expect(resize.disconnected).toBe(true);
});
