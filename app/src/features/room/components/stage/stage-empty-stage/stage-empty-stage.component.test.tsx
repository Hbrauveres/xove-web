import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NO_SCREEN } from "../../../constants/stream-words.constants";
import { StageEmptyStage } from "./stage-empty-stage.component";
import type { StageEmptyStageProps } from "./types/stage-empty-stage.types";

const props = (over: Partial<StageEmptyStageProps> = {}) => ({
  canShareScreen: true,
  onStart: vi.fn<StageEmptyStageProps["onStart"]>(),
  onSettings: vi.fn<StageEmptyStageProps["onSettings"]>(),
  ...over,
});

describe("the empty stage", () => {
  it("offers one way to start, Go live, whose menu starts what's picked", async () => {
    const p = props();
    render(<StageEmptyStage {...p} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Go live" }));
    await user.click(screen.getByRole("menuitem", { name: "Share your screen" }));
    await user.click(screen.getByRole("button", { name: "Go live" }));
    await user.click(screen.getByRole("menuitem", { name: "Turn on your camera" }));
    expect(vi.mocked(p.onStart).mock.calls).toEqual([["screen"], ["camera"]]);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens the settings from Go live's menu", async () => {
    const p = props();
    render(<StageEmptyStage {...p} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Go live" }));
    await user.click(screen.getByRole("menuitem", { name: "Settings" }));
    expect(p.onSettings).toHaveBeenCalledTimes(1);
  });

  it("greys the screen where the browser can't share one, saying why", async () => {
    render(<StageEmptyStage {...props({ canShareScreen: false })} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Go live" }));
    expect(screen.getByRole("menuitem", { name: /share your screen/i })).toHaveAccessibleDescription(NO_SCREEN);
  });

  it("has no words and no buttons of its own: no heading, no 'Standby', no Screen or Camera", () => {
    const { container } = render(<StageEmptyStage {...props()} />);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(container).not.toHaveTextContent(/standby|what's on today/i);
  });

  it("says nothing the row below says: no names, no seats, no 'nobody'", () => {
    const { container } = render(<StageEmptyStage {...props()} />);
    expect(container).not.toHaveTextContent(/here|seat|of 6|nobody/i);
  });

  it("sets the scene behind it: the eye on the horizon and the grid", () => {
    const { container } = render(<StageEmptyStage {...props()} />);
    expect(container.querySelector('[data-part="eye"]')).not.toBeNull();
    expect(container.querySelector('[data-part="grid"]')).not.toBeNull();
  });

  it("has four viewfinder corners, the top right one the neon", () => {
    const { container } = render(<StageEmptyStage {...props()} />);
    const corners = [...container.querySelectorAll("[data-at]")];
    expect(corners.map((c) => c.getAttribute("data-at"))).toEqual(["tl", "tr", "bl", "br"]);
    expect(corners.every((c) => c.getAttribute("aria-hidden") === "true")).toBe(true);
    expect(container.querySelector('[data-at="tr"]')).toHaveAttribute("data-neon");
  });
});
