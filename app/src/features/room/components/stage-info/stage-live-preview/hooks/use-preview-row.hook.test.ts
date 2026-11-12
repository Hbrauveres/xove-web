import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { floatingStore } from "@shared/stores/floating-store";
import { usePreviewTray } from "../../../../hooks/use-preview-tray.hook";
import { usePreviewRow } from "./use-preview-row.hook";

const setup = (canOpen = true) => {
  const { result } = renderHook(() => {
    const tray = usePreviewTray();
    return { tray, row: usePreviewRow("user-2", canOpen, tray) };
  });
  const li = document.createElement("li");
  const picture = document.createElement("span");
  // As React would, once the preview is on the page.
  Object.assign(result.current.row.item, { current: li });
  Object.assign(result.current.row.picture, { current: picture });
  return result;
};

describe("usePreviewRow", () => {
  it("opens the preview's row when the pointer comes", () => {
    const result = setup();
    act(() => result.current.row.onPointerEnter());
    expect(result.current.tray.open?.id).toBe("user-2");
    expect(result.current.row.isOpen).toBe(true);
  });

  it("opens nothing for a preview with no row, or over what I opened", () => {
    expect(
      (() => {
        const result = setup(false);
        act(() => result.current.row.onPointerEnter());
        return result.current.tray.open;
      })(),
    ).toBeNull();
    floatingStore.add({ kind: "opened", close: vi.fn(), area: () => null });
    const result = setup();
    act(() => result.current.row.onPointerEnter());
    expect(result.current.tray.open).toBeNull();
  });
});
