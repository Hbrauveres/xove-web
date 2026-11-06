import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { aSharer } from "../../../../testing/factories/sharer.factory";
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
    expect(container.querySelectorAll("i[data-at]")).toHaveLength(4);
  });

  it("turns the TV on only the first time it stands by", () => {
    const big = aSharer();
    const { container, rerender, props } = renderView();
    expect(container.querySelector('[class*="intro"]')).not.toBeNull();
    rerender(<StageView {...props} big={big} main={big.screen ?? null} />);
    rerender(<StageView {...props} />);
    expect(container.querySelector('[class*="intro"]')).toBeNull();
  });

  it("plays the big stream, with no standby glow", () => {
    const big = aSharer();
    const { container } = renderView({ big, main: big.screen ?? null });
    expect(screen.getByLabelText("Bruno's shared screen")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Go live" })).not.toBeInTheDocument();
    expect(container.querySelectorAll("i[data-at]")).toHaveLength(0);
  });

  it("keeps the facecam where it was moved", () => {
    const big = aSharer({ kinds: ["screen", "camera"] });
    renderView({ big, main: big.screen ?? null, small: big.camera });
    expect(screen.getByRole("application", { name: /Bruno's camera/ }).style.left).toBe("73%");
  });
});
