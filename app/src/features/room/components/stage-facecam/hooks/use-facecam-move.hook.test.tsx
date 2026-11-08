import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import type { FacecamPlace } from "../../../types/facecam.types";
import { useFacecamMove } from "./use-facecam-move.hook";

/** The player is 1000×500 px; the box 200×100 px, so it can go 80% across and 80% down. */
function sizes() {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const box = this.dataset.testid === "box";
    return DOMRect.fromRect({ x: 0, y: 0, width: box ? 200 : 1000, height: box ? 100 : 500 });
  });
}

function Mover({ place, onMove }: { place: FacecamPlace; onMove: (p: FacecamPlace) => void }) {
  const player = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const buttons = useRef<HTMLDivElement>(null);
  const move = useFacecamMove({ box, buttons, player, place, onMove });
  return (
    <div ref={player}>
      <div ref={box} data-testid="box" role="application" tabIndex={0} {...move}>
        <div ref={buttons}>
          <button type="button">Swap</button>
        </div>
      </div>
    </div>
  );
}

describe("moving the small view", () => {
  it("follows a drag as shares of the player, kept inside it", () => {
    sizes();
    const onMove = vi.fn();
    render(<Mover place={{ x: 0.1, y: 0.1 }} onMove={onMove} />);
    const box = screen.getByTestId("box");
    fireEvent.pointerDown(box, { clientX: 0, clientY: 0, pointerId: 7 });
    fireEvent.pointerMove(box, { clientX: 100, clientY: 50, pointerId: 7 });
    expect(onMove).toHaveBeenLastCalledWith({ x: 0.2, y: 0.2 });
    fireEvent.pointerMove(box, { clientX: 9000, clientY: 9000, pointerId: 7 });
    expect(onMove).toHaveBeenLastCalledWith({ x: 0.8, y: 0.8 });
  });

  it("ignores another pointer, a drag from its buttons, and a pointer let go", () => {
    sizes();
    const onMove = vi.fn();
    render(<Mover place={{ x: 0.1, y: 0.1 }} onMove={onMove} />);
    const box = screen.getByTestId("box");
    fireEvent.pointerDown(screen.getByRole("button", { name: "Swap" }), { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(box, { clientX: 100, clientY: 50, pointerId: 1 });
    fireEvent.pointerDown(box, { clientX: 0, clientY: 0, pointerId: 2 });
    fireEvent.pointerMove(box, { clientX: 100, clientY: 50, pointerId: 3 });
    fireEvent.pointerUp(box, { pointerId: 2 });
    fireEvent.pointerMove(box, { clientX: 100, clientY: 50, pointerId: 2 });
    expect(onMove).not.toHaveBeenCalled();
  });

  it("moves a step with each arrow key, only from the box itself", () => {
    sizes();
    const onMove = vi.fn();
    render(<Mover place={{ x: 0.5, y: 0.5 }} onMove={onMove} />);
    fireEvent.keyDown(screen.getByTestId("box"), { key: "ArrowUp" });
    expect(onMove).toHaveBeenLastCalledWith({ x: 0.5, y: 0.45 });
    fireEvent.keyDown(screen.getByTestId("box"), { key: "a" });
    fireEvent.keyDown(screen.getByRole("button", { name: "Swap" }), { key: "ArrowUp" });
    expect(onMove).toHaveBeenCalledTimes(1);
  });

  it("on a player too small for where it was, starts a drag or an arrow from where it shows", () => {
    sizes();
    const onMove = vi.fn();
    // 0.95 across: past the 0.8 a 200 px box can go in a 1000 px player, so it shows at 0.8.
    render(<Mover place={{ x: 0.95, y: 0.9 }} onMove={onMove} />);
    const box = screen.getByTestId("box");
    fireEvent.pointerDown(box, { clientX: 500, clientY: 250, pointerId: 3 });
    fireEvent.pointerMove(box, { clientX: 400, clientY: 250, pointerId: 3 });
    // 100 px left of where it shows, at once: no dead travel through where it can't be.
    expect(onMove).toHaveBeenLastCalledWith({ x: 0.7, y: 0.8 });
    fireEvent.pointerUp(box, { pointerId: 3 });
    box.focus();
    fireEvent.keyDown(box, { key: "ArrowUp" });
    expect(onMove).toHaveBeenLastCalledWith({ x: 0.8, y: 0.75 });
  });
});
