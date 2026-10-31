import { act, render } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { useFloating } from "./use-floating.hook";

function Piece({ open, close }: { open: boolean; close: () => void }) {
  const area = useRef<HTMLDivElement>(null);
  useFloating({ open, kind: "opened", close, area: () => area.current });
  return <div ref={area} data-testid="area" />;
}

describe("floating while open", () => {
  it("a press outside closes it only while it's open", () => {
    const close = vi.fn();
    const { rerender, unmount } = render(<Piece open={false} close={close} />);
    const press = () => act(() => void document.body.dispatchEvent(new Event("pointerdown", { bubbles: true })));
    press();
    expect(close).not.toHaveBeenCalled();
    rerender(<Piece open close={close} />);
    press();
    expect(close).toHaveBeenCalledOnce();
    unmount();
  });

  it("calling the latest close, after a render", () => {
    const [first, second] = [vi.fn(), vi.fn()];
    const { rerender, unmount } = render(<Piece open close={first} />);
    rerender(<Piece open close={second} />);
    act(() => void document.body.dispatchEvent(new Event("pointerdown", { bubbles: true })));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
    unmount();
  });
});
