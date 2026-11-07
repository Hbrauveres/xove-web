import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import type { MediaTrack } from "@services/livekit-service";
import { FakeTrack } from "../../../../testing/fakeLiveKit";
import type { StageFacecamProps } from "./types/stage-facecam.types";
import { aFold } from "@testing/factories/small-view-fold.factory";
import { StageFacecam } from "./stage-facecam.component";

/** The player is 1000×500 px; the facecam 240×135 px (24% of its width). */
function sizes() {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const facecam = this.getAttribute("aria-roledescription") === "small view";
    const width = facecam ? 240 : 1000;
    const height = facecam ? 135 : 500;
    return DOMRect.fromRect({ x: 0, y: 0, width, height });
  });
}

/** The facecam in its player, as the stage's picture holds it. */
function InPlayer(props: Omit<StageFacecamProps, "player">) {
  const player = useRef<HTMLDivElement>(null);
  return (
    <div ref={player}>
      <StageFacecam {...props} player={player} />
    </div>
  );
}

function renderFacecam(overrides: Partial<Omit<StageFacecamProps, "player">> = {}) {
  const props: Omit<StageFacecamProps, "player"> = {
    video: new FakeTrack() as unknown as MediaTrack,
    label: "Bruno's camera",
    place: { x: 0.7, y: 0.6 },
    fold: aFold(),
    onSwap: vi.fn(),
    onMove: vi.fn(),
    ...overrides,
  };
  render(<InPlayer {...props} />);
  return props;
}

const facecam = () => screen.getByRole("application", { name: /Bruno's camera/ });

describe("the small view", () => {
  it("plays the small video, where it was put", () => {
    const track = new FakeTrack();
    renderFacecam({ video: track as unknown as MediaTrack });

    expect(track.attached).toContain(screen.getByLabelText("Bruno's camera"));
    expect(facecam().style.left).toContain("70%");
    expect(facecam().style.top).toBe("60%");
  });

  it("swaps the views with its button, which says so on hover", async () => {
    const props = renderFacecam();
    const swap = screen.getByRole("button", { name: "Swap views" });
    // Its tooltip says what its name says: a screen reader hears it once.
    expect(swap).not.toHaveAccessibleDescription();
    await userEvent.setup().click(swap);
    expect(props.onSwap).toHaveBeenCalledTimes(1);
  });

  it("doesn't swap when the small view itself is clicked or dragged", async () => {
    sizes();
    const props = renderFacecam();
    await userEvent.setup().click(screen.getByLabelText("Bruno's camera"));
    expect(props.onSwap).not.toHaveBeenCalled();
  });

  it("is dragged anywhere over the player, but never out of it", () => {
    sizes();
    const props = renderFacecam({ place: { x: 0.1, y: 0.1 } });

    fireEvent.pointerDown(facecam(), { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(facecam(), { clientX: 300, clientY: 150, pointerId: 1 });
    expect(props.onMove).toHaveBeenLastCalledWith({ x: 0.3, y: 0.2 });

    fireEvent.pointerMove(facecam(), { clientX: 5000, clientY: -800, pointerId: 1 });
    expect(props.onMove).toHaveBeenLastCalledWith({ x: 0.76, y: 0 });

    fireEvent.pointerUp(facecam(), { pointerId: 1 });
    fireEvent.pointerMove(facecam(), { clientX: 0, clientY: 0, pointerId: 1 });
    expect(props.onMove).toHaveBeenCalledTimes(2);
  });

  it("isn't dragged from its buttons", () => {
    sizes();
    const props = renderFacecam({ place: { x: 0.1, y: 0.1 } });
    fireEvent.pointerDown(screen.getByRole("button", { name: "Swap views" }), {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerMove(facecam(), { clientX: 300, clientY: 150, pointerId: 1 });
    expect(props.onMove).not.toHaveBeenCalled();
  });

  it("moves with the arrow keys too", () => {
    sizes();
    const props = renderFacecam({ place: { x: 0.5, y: 0.5 } });

    fireEvent.keyDown(facecam(), { key: "ArrowLeft" });
    expect(props.onMove).toHaveBeenLastCalledWith({ x: 0.45, y: 0.5 });
    fireEvent.keyDown(facecam(), { key: "ArrowDown" });
    expect(props.onMove).toHaveBeenLastCalledWith({ x: 0.5, y: 0.55 });
  });

  it("is called the small view, and Hide folds it", async () => {
    const props = renderFacecam();
    expect(facecam()).toHaveAttribute("aria-roledescription", "small view");
    await userEvent.setup().click(screen.getByRole("button", { name: "Hide the small view" }));
    expect(props.fold.hide).toHaveBeenCalledOnce();
  });

  it("hands the fold its box and its Hide button", () => {
    const props = renderFacecam();
    expect(props.fold.setBox).toHaveBeenCalledWith(facecam());
    expect(props.fold.setHide).toHaveBeenCalledWith(screen.getByRole("button", { name: "Hide the small view" }));
  });
});
