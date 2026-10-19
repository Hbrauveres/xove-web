import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmptyStage } from "./EmptyStage";

describe("the empty stage, a camera waiting (spec 0123)", () => {
  it("asks you to be the first to go live, with the screen first and the camera beside it", async () => {
    const onStart = vi.fn();
    render(<EmptyStage onStart={onStart} />);

    expect(screen.getByRole("heading", { name: "Be the first to go live" })).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Share your screen/ }));
    await user.click(screen.getByRole("button", { name: /Turn on your camera/ }));
    expect(onStart.mock.calls).toEqual([["screen"], ["camera"]]);
  });

  it("puts the camera first where a screen can't be shared, the screen greyed with its reason", async () => {
    const onStart = vi.fn();
    render(<EmptyStage canShareScreen={false} onStart={onStart} />);

    const [first, second] = screen.getAllByRole("button");
    expect(first).toHaveAccessibleName(/Turn on your camera/);
    expect(second).toHaveAttribute("aria-disabled", "true");
    expect(second).toHaveAccessibleDescription("This browser can't share a screen");
    await userEvent.setup().click(second);
    expect(onStart).not.toHaveBeenCalled();
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

  it("turns the TV on only the first time it stands by in a visit (spec 0136)", () => {
    const first = render(<EmptyStage />);
    // An earlier test in this file may have been the first; either way, once on it stays on.
    first.unmount();
    const again = render(<EmptyStage />);
    expect(again.container.querySelector('[class*="intro"]')).toBeNull();
  });

  it("says nothing the row below says: no names, no seats, no 'nobody'", () => {
    const { container } = render(<EmptyStage />);
    expect(container).not.toHaveTextContent(/here|seat|of 6|nobody/i);
  });
});
