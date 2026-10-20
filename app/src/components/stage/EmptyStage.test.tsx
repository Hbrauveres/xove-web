import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmptyStage } from "./EmptyStage";

describe("the empty stage, a camera waiting (spec 0123)", () => {
  it("asks you to start sharing: Screen first, Camera beside it, each named for the whole act (spec 0138)", async () => {
    const onStart = vi.fn();
    render(<EmptyStage onStart={onStart} />);

    expect(screen.getByRole("heading", { name: "Start sharing" })).toBeInTheDocument();
    const [first, second] = screen.getAllByRole("button");
    expect(first).toHaveTextContent("Screen");
    expect(first).toHaveAccessibleName("Share your screen");
    expect(second).toHaveTextContent("Camera");
    expect(second).toHaveAccessibleName("Turn on your camera");
    const user = userEvent.setup();
    await user.click(first);
    await user.click(second);
    expect(onStart.mock.calls).toEqual([["screen"], ["camera"]]);
  });

  it("greys the screen in place where it can't be shared, saying why, and keeps the camera beside it", async () => {
    const onStart = vi.fn();
    render(<EmptyStage canShareScreen={false} onStart={onStart} />);

    const [first, second] = screen.getAllByRole("button");
    expect(first).toHaveAccessibleName("Share your screen");
    expect(first).toHaveTextContent("Screen");
    expect(first).toHaveAttribute("aria-disabled", "true");
    expect(first).toHaveAccessibleDescription("This browser can't share a screen");
    expect(second).toHaveAccessibleName("Turn on your camera");
    const user = userEvent.setup();
    await user.click(first);
    expect(onStart).not.toHaveBeenCalled();
    await user.click(second);
    expect(onStart).toHaveBeenCalledWith("camera");
  });

  it("says nothing more than the heading and the two buttons: no line under it (spec 0138)", () => {
    const { container, rerender } = render(<EmptyStage />);
    expect(container.querySelector("[data-empty] p")).not.toBeInTheDocument();
    rerender(<EmptyStage canShareScreen={false} />);
    expect(container.querySelector("[data-empty] p")).not.toBeInTheDocument();
    expect(screen.queryByText(/room sees/)).not.toBeInTheDocument();
  });

  it("has four viewfinder corners, the top right red, and only a still 'Standby' (spec 0136)", () => {
    const { container } = render(<EmptyStage />);
    expect(container.querySelectorAll("[data-mark]")).toHaveLength(4);
    expect(container.querySelector('[data-mark="tr"]')).toBeInTheDocument();
    const display = container.querySelector("[data-empty]") as HTMLElement;
    expect(within(display).getByText("Standby")).toBeInTheDocument();
    // The camera display's clutter is gone: no clock, room, format, frame rate or signal.
    expect(display).not.toHaveTextContent(/\d\d:\d\d|Room 01|16:9|HD|fps|Online/);
  });

  it("says nothing the row below says: no names, no seats, no 'nobody'", () => {
    const { container } = render(<EmptyStage />);
    expect(container).not.toHaveTextContent(/here|seat|of 6|nobody/i);
  });
});
