import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OpenRow } from "../../../types/preview-tray.types";
import { GAP } from "../constants/stage-preview-tray-row.constants";
import { useRowPlace } from "./use-row-place.hook";

/** A row on the hook, as the tray's row uses it. */
function Row({ open, onElement }: { open: OpenRow; onElement?: (el: HTMLElement | null) => void }) {
  const { ref } = useRowPlace(open, onElement);
  return <div ref={ref} data-testid="row" />;
}

const pictureAt = (top: number) => {
  const picture = document.createElement("li");
  vi.spyOn(picture, "getBoundingClientRect").mockReturnValue(new DOMRect(40, top, 128, 72));
  return { id: "user-2", anchor: picture, picture };
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
});
