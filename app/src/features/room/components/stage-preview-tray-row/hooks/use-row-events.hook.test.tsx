import { fireEvent, render } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import type { OpenRow } from "../../../types/preview-tray.types";
import { useRowEvents } from "./use-row-events.hook";

function Row({ open, handlers }: { open: OpenRow; handlers: Parameters<typeof useRowEvents>[2] }) {
  const ref = useRef<HTMLDivElement>(null);
  useRowEvents(ref, open, handlers);
  return (
    <div ref={ref} data-testid="row">
      <button>Mute</button>
    </div>
  );
}

const setup = () => {
  const anchor = document.createElement("li");
  document.body.append(anchor);
  const handlers = { onEnter: vi.fn(), onLeave: vi.fn(), onRolledBack: vi.fn() };
  const view = render(<Row open={{ id: "user-2", anchor, picture: anchor }} handlers={handlers} />);
  return { ...handlers, row: view.getByTestId("row") };
};

describe("useRowEvents", () => {
  it("keeps the row while the pointer is on it, and lets it go when a mouse leaves", () => {
    const { row, onEnter, onLeave } = setup();
    fireEvent.pointerEnter(row);
    expect(onEnter).toHaveBeenCalledOnce();
    fireEvent.pointerLeave(row, { pointerType: "touch" });
    expect(onLeave).not.toHaveBeenCalled();
    fireEvent.pointerLeave(row, { pointerType: "mouse" });
    expect(onLeave).toHaveBeenCalledOnce();
  });

  it("lets it go when the focus leaves for anywhere but its preview", () => {
    const { row, onLeave } = setup();
    fireEvent.focusOut(row, { relatedTarget: null });
    expect(onLeave).toHaveBeenCalledOnce();
  });
});
