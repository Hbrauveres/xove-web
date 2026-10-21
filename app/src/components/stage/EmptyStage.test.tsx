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
    // One word each on the pill; the spoken name says the act (spec 0138).
    expect(screen.getByRole("button", { name: "Share your screen" })).toHaveTextContent(/^Screen$/);
    expect(screen.getByRole("button", { name: "Turn on your camera" })).toHaveTextContent(/^Camera$/);
    await user.click(screen.getByRole("button", { name: /Share your screen/ }));
    await user.click(screen.getByRole("button", { name: /Turn on your camera/ }));
    expect(onStart.mock.calls).toEqual([["screen"], ["camera"]]);
  });

  it("holds only the two ways to start: the settings stay in the stage's corner (spec 0147)", () => {
    render(<EmptyStage />);
    expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual([
      "Share your screen",
      "Turn on your camera",
    ]);
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

  it("says one short line, and greys the screen it can't share as the same pill, saying why (specs 0136, 0138)", () => {
    const { rerender } = render(<EmptyStage />);
    // An invitation, not an order, wherever it is (spec 0138).
    expect(screen.getByText("What's on today?")).toBeInTheDocument();
    expect(screen.queryByText(/or turn on your camera/i)).not.toBeInTheDocument();
    rerender(<EmptyStage canShareScreen={false} />);
    expect(screen.getByText("What's on today?")).toBeInTheDocument();
    expect(screen.queryByText(/turn on your camera\./i)).not.toBeInTheDocument();
    // No "and the room sees it at once": it says what to do, not what follows.
    expect(screen.queryByText(/room sees/)).not.toBeInTheDocument();
    // The same pill as where it can be shared, greyed, still saying why.
    const greyed = screen.getByRole("button", { name: "Share your screen" });
    expect(greyed).toHaveTextContent("Screen");
    expect(greyed).toHaveAccessibleDescription("This browser can't share a screen");
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
