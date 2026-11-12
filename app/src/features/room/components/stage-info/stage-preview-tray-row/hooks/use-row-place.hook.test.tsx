import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OpenRow } from "../../../../types/preview-tray.types";
import { GAP } from "../constants/stage-preview-tray-row.constants";
import { useRowPlace } from "./use-row-place.hook";

/** A row on the hook, as the tray's row uses it. */
function Row({ open, onElement }: { open: OpenRow; onElement?: (el: HTMLElement | null) => void }) {
  const { ref } = useRowPlace(open, onElement);
  return <div ref={ref} data-testid="row" />;
}

const pictureAt = (top: number) => {
  const anchor = document.createElement("li");
  const picture = anchor.appendChild(document.createElement("span"));
  vi.spyOn(anchor, "getBoundingClientRect").mockReturnValue(new DOMRect(40, top, 128, 72));
  for (const [k, v] of Object.entries({ offsetLeft: 0, offsetTop: 0, offsetWidth: 128, offsetHeight: 72 }))
    Object.defineProperty(picture, k, { value: v });
  return { id: "user-2", anchor, picture };
};

describe("useRowPlace", () => {
  it("glues the row under its picture, at its width, and hands its element on", () => {
    const onElement = vi.fn();
    const { getByTestId } = render(<Row open={pictureAt(100)} onElement={onElement} />);
    const row = getByTestId("row");
    expect(row.style).toMatchObject({ left: "40px", width: "128px", top: `${100 + 72 + GAP}px`, bottom: "" });
    expect(onElement).toHaveBeenCalledWith(row);
  });

  it("near the window's bottom, puts it above", () => {
    const { getByTestId } = render(<Row open={pictureAt(window.innerHeight - 80)} />);
    expect(getByTestId("row").style).toMatchObject({ top: "", bottom: `${80 + GAP}px` });
  });

  it("follows its picture's slot on every frame, never the bounce drawn on the picture", () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
    const open = pictureAt(100);
    const { getByTestId } = render(<Row open={open} />);
    const row = getByTestId("row");
    // A swap's bounce draws the picture 7 px lower: the row stays on the slot.
    vi.spyOn(open.picture, "getBoundingClientRect").mockReturnValue(new DOMRect(40, 107, 128, 72));
    act(() => vi.advanceTimersToNextFrame());
    expect(row.style.top).toBe(`${100 + 72 + GAP}px`);
    // The slot itself moves (the strip settling): the row follows.
    vi.spyOn(open.anchor, "getBoundingClientRect").mockReturnValue(new DOMRect(40, 120, 128, 72));
    act(() => vi.advanceTimersToNextFrame());
    expect(row.style.top).toBe(`${120 + 72 + GAP}px`);
  });
});
