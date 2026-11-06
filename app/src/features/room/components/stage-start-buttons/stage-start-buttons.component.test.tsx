import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { toastStore } from "@shared/stores/toast-store";
import { StageStartButtons } from "./stage-start-buttons.component";

describe("the ways to start", () => {
  it("offers the screen first and the camera beside it, one word each, their names saying the act", async () => {
    const onStart = vi.fn();
    render(<StageStartButtons onStart={onStart} />);
    const [first, second] = screen.getAllByRole("button");
    expect(first).toHaveAccessibleName("Share your screen");
    expect(first).toHaveTextContent(/^Screen$/);
    expect(second).toHaveAccessibleName("Turn on your camera");
    expect(second).toHaveTextContent(/^Camera$/);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Share your screen" }));
    await user.click(screen.getByRole("button", { name: "Turn on your camera" }));
    expect(onStart.mock.calls).toEqual([["screen"], ["camera"]]);
  });

  it("puts the camera first where a screen can't be shared, the screen the same pill greyed, saying why", async () => {
    const onStart = vi.fn();
    render(<StageStartButtons canShareScreen={false} onStart={onStart} />);
    const [first, second] = screen.getAllByRole("button");
    expect(first).toHaveAccessibleName("Turn on your camera");
    expect(second).toHaveAttribute("aria-disabled", "true");
    expect(second).toHaveTextContent("Screen");
    expect(second).toHaveAccessibleDescription("This browser can't share a screen");
    await userEvent.setup().click(screen.getByRole("button", { name: "Share your screen" }));
    expect(onStart).not.toHaveBeenCalled();
    expect(toastStore.current()?.text).toBe("This browser can't share a screen");
  });
});
