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
    onSettings: vi.fn(),
    ...over,
  };
  return { props, ...render(<StageView {...props} />) };
}

describe("the stage's view", () => {
  it("with nobody live, shows the empty stage with nothing lit on the wall and no static, the light on or off", () => {
    for (const on of [true, false]) {
      const { container, unmount } = renderView({ ambilight: { on, brightness: 0.9 } });
      expect(screen.getByRole("button", { name: "Go live" })).toBeInTheDocument();
      expect(container.querySelector("canvas")).toBeNull();
      // Nothing outside the picture: the light's layers sit beside it.
      expect(container.firstElementChild?.children).toHaveLength(1);
      unmount();
    }
  });

  it("hands Go live's settings to the player", async () => {
    const { props } = renderView();
    fireEvent.click(screen.getByRole("button", { name: "Go live" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Settings" }));
    expect(props.onSettings).toHaveBeenCalledTimes(1);
  });

  it("plays the big stream, with nothing else beside it", () => {
    const big = aSharer();
    const { container } = renderView({ big, main: big.screen ?? null });
    expect(screen.getByLabelText("Bruno's shared screen")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Go live" })).not.toBeInTheDocument();
    expect(container.querySelectorAll("[data-at]")).toHaveLength(0);
  });

  it("starts the small view at the top right", () => {
    const big = aSharer({ kinds: ["screen", "camera"] });
    renderView({ big, main: big.screen ?? null, small: big.camera });
    // At the top right, clear of the round buttons and the fullscreen button.
    expect(screen.getByRole("application", { name: /Bruno's camera/ }).style.left).toContain("73%");
    expect(screen.getByRole("application", { name: /Bruno's camera/ }).style.top).toBe("4%");
  });

  it("puts the camera in the small view over the screen, on the picture, not on the box's dark sides", () => {
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

  it("swaps the views with the small view's button", () => {
    const big = aSharer({ kinds: ["screen", "camera"] });
    const { props } = renderView({ big, main: big.screen ?? null, small: big.camera });
    fireEvent.click(screen.getByRole("button", { name: "Swap views" }));
    expect(props.onSwap).toHaveBeenCalledTimes(1);
  });
});
