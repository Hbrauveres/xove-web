import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmptyStage } from "./EmptyStage";

describe("the empty stage, a camera waiting (spec 0123)", () => {
  it("asks you to go live, with the screen first and the camera beside it", async () => {
    const onStart = vi.fn();
    render(<EmptyStage onStart={onStart} />);

    // "Go LIVE", LIVE marked as on the sign-in page and read as a word (spec 0141).
    const heading = screen.getByRole("heading", { name: "Go live" });
    expect(heading.querySelector("em")).toHaveTextContent(/^live$/);
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

  it("says one short line, and greys the screen it can't share as a small button named for it (spec 0136)", () => {
    const { rerender } = render(<EmptyStage />);
    expect(screen.getByText("Share your screen or turn on your camera.")).toBeInTheDocument();
    rerender(<EmptyStage canShareScreen={false} />);
    // Where a screen can't be shared, no line at all: the camera's button says it (spec 0138).
    expect(screen.queryByText(/Turn on your camera\./)).not.toBeInTheDocument();
    expect(screen.queryByText(/Share your screen or/)).not.toBeInTheDocument();
    // No "and the room sees it at once": it says what to do, not what follows.
    expect(screen.queryByText(/room sees/)).not.toBeInTheDocument();
    // Icon only, still named and saying why.
    const greyed = screen.getByRole("button", { name: "Share your screen" });
    expect(greyed).toHaveTextContent("");
    expect(greyed).toHaveAccessibleDescription("This browser can't share a screen");
  });

  it("offers the two ways as round icon buttons where a screen can't be shared, named by their tooltips (spec 0138)", () => {
    render(<EmptyStage canShareScreen={false} />);
    const camera = screen.getByRole("button", { name: "Turn on your camera" });
    const greyed = screen.getByRole("button", { name: "Share your screen" });
    expect(camera).toHaveTextContent("");
    expect(greyed).toHaveTextContent("");
    expect(camera.className).toEqual(expect.stringContaining("round"));
    expect(greyed.className).toEqual(expect.stringContaining("round"));
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
