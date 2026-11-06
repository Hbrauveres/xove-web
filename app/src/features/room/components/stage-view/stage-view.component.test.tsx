import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { aSharer } from "@testing/factories/sharer.factory";
import { aFold } from "@testing/factories/small-view-fold.factory";
import type { StageViewProps } from "./types/stage-view.types";
import { StageView } from "./stage-view.component";

function renderView(over: Partial<StageViewProps> = {}) {
  const props: StageViewProps = {
    big: null,
    main: null,
    sound: { volume: 1, muted: false },
    ambilight: { on: true, brightness: 0.9 },
    shape: 16 / 9,
    lightKey: "none",
    video: null,
    onVideo: vi.fn(),
    onSwap: vi.fn(),
    fold: aFold(),
    canShareScreen: true,
    onStart: vi.fn(),
    ...over,
  };
  return { props, ...render(<StageView {...props} />) };
}

describe("the stage's view", () => {
  it("stands by with nobody live: the TV, its corners lit round the stage", () => {
    const { container } = renderView();
    expect(screen.getByRole("heading", { name: "Go live" })).toBeInTheDocument();
    const corners = container.querySelectorAll("i[data-at]");
    expect(corners).toHaveLength(4);
    expect(corners[0]?.parentElement?.style.opacity).toBe("0.9");
  });

  it("turns the TV on only the first time it stands by", () => {
    const big = aSharer();
    const { container, rerender, props } = renderView();
    // The stage's flash and the wall's, together.
    const flashes = () => [container.querySelector('[class*="intro"]'), container.querySelector('[class*="flash"]')];
    expect(flashes()).not.toContain(null);
    rerender(<StageView {...props} big={big} main={big.screen ?? null} />);
    rerender(<StageView {...props} />);
    expect(flashes()).toEqual([null, null]);
  });

  it("plays the big stream, with no standby glow", () => {
    const big = aSharer();
    const { container } = renderView({ big, main: big.screen ?? null });
    expect(screen.getByLabelText("Bruno's shared screen")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Go live" })).not.toBeInTheDocument();
    expect(container.querySelectorAll("i[data-at]")).toHaveLength(0);
  });

  it("starts the facecam at the top right", () => {
    const big = aSharer({ kinds: ["screen", "camera"] });
    renderView({ big, main: big.screen ?? null, small: big.camera });
    // At the top right, clear of the round buttons and the fullscreen button.
    expect(screen.getByRole("application", { name: /Bruno's camera/ }).style.left).toBe("73%");
    expect(screen.getByRole("application", { name: /Bruno's camera/ }).style.top).toBe("4%");
  });

  it("puts the camera in the facecam over the screen, on the picture, not on the box's dark sides", () => {
    const big = aSharer({ kinds: ["screen", "camera"] });
    const { container } = renderView({ big, main: big.screen ?? null, small: big.camera });
    const facecam = screen.getByRole("application", { name: /Bruno's camera/ });
    expect(within(facecam).getByLabelText("Bruno's camera")).toBeInTheDocument();
    expect(facecam.contains(screen.getByLabelText("Bruno's shared screen"))).toBe(false);
    expect(container.firstElementChild?.contains(facecam)).toBe(true);
  });

  it("draws no small view while it's folded", () => {
    const big = aSharer({ kinds: ["screen", "camera"] });
    renderView({ big, main: big.screen ?? null, small: big.camera, fold: aFold({ folded: true }) });
    expect(screen.queryByLabelText("Bruno's camera")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Bruno's shared screen")).toBeInTheDocument();
  });

  it("drops the small view when the camera stops, the screen still big", () => {
    const big = aSharer({ kinds: ["screen", "camera"] });
    const { props, rerender } = renderView({ big, main: big.screen ?? null, small: big.camera });
    rerender(<StageView {...props} small={undefined} />);
    expect(screen.queryByRole("application", { name: /facecam|camera/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Bruno's shared screen")).toBeInTheDocument();
  });

  it("swaps the views with the facecam's button", () => {
    const big = aSharer({ kinds: ["screen", "camera"] });
    const { props } = renderView({ big, main: big.screen ?? null, small: big.camera });
    fireEvent.click(screen.getByRole("button", { name: "Swap views" }));
    expect(props.onSwap).toHaveBeenCalledTimes(1);
  });
});
