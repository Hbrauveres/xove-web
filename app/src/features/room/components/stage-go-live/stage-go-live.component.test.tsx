import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NO_SCREEN } from "../../constants/stream-words.constants";
import { StageGoLive } from "./stage-go-live.component";

const props = (over = {}) => ({ canShareScreen: true, onStart: vi.fn(), onSettings: vi.fn(), ...over });

describe("Go live", () => {
  it("opens its menu, and starts what's picked", async () => {
    const p = props();
    render(<StageGoLive {...p} />);
    await userEvent.click(screen.getByRole("button", { name: "Go live" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Turn on your camera" }));
    expect(p.onStart).toHaveBeenCalledWith("camera");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("greys the screen where the browser can't share one, saying why", async () => {
    render(<StageGoLive {...props({ canShareScreen: false })} />);
    await userEvent.click(screen.getByRole("button", { name: "Go live" }));
    expect(screen.getByRole("menuitem", { name: /share your screen/i })).toHaveAccessibleDescription(NO_SCREEN);
  });
});
