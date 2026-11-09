import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StageGoLiveRows } from "./stage-go-live-rows.component";
import userEvent from "@testing-library/user-event";
const props = (over = {}) => ({
  canShareScreen: true,
  onStart: vi.fn(),
  onSettings: vi.fn(),
  onPicked: vi.fn(),
  ...over,
});

describe("Go live's rows", () => {
  it("start what's picked, and say a row was picked so the menu closes", async () => {
    const p = props();
    render(<StageGoLiveRows {...p} />);
    await userEvent.click(screen.getByRole("button", { name: "Share your screen" }));
    expect(p.onStart).toHaveBeenCalledWith("screen");
    expect(p.onPicked).toHaveBeenCalled();
  });

  it("open the settings", async () => {
    const p = props();
    render(<StageGoLiveRows {...p} />);
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(p.onSettings).toHaveBeenCalled();
  });

  it("grey the ways to start in a full room, saying why", () => {
    render(<StageGoLiveRows {...props({ full: "The room is full." })} />);
    expect(screen.getByRole("button", { name: /turn on your camera/i })).toHaveAccessibleDescription(
      "The room is full.",
    );
  });
});
