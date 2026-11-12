import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StageEmptyStage } from "./stage-empty-stage.component";
import userEvent from "@testing-library/user-event";
/** The empty stage, the TV already on. */
const Empty = (props: { canShareScreen?: boolean; onStart?: () => void }) => (
  <StageEmptyStage {...props} turnOn={false} onStandby={() => undefined} />
);

describe("the empty stage, a TV on standby", () => {
  it("asks you to go live, with the screen first and the camera beside it", async () => {
    const onStart = vi.fn();
    render(<Empty onStart={onStart} />);

    // "Go LIVE", LIVE marked as on the sign-in page and read as a word.
    const heading = screen.getByRole("heading", { name: "Go live" });
    expect(heading.querySelector("em")).toHaveTextContent(/^live$/);
    const user = userEvent.setup();
    // One word each on the pill; the spoken name says the act.
    expect(screen.getByRole("button", { name: "Share your screen" })).toHaveTextContent(/^Screen$/);
    expect(screen.getByRole("button", { name: "Turn on your camera" })).toHaveTextContent(/^Camera$/);
    await user.click(screen.getByRole("button", { name: /Share your screen/ }));
    await user.click(screen.getByRole("button", { name: /Turn on your camera/ }));
    expect(onStart.mock.calls).toEqual([["screen"], ["camera"]]);
  });

  it("puts the camera first where a screen can't be shared, the screen greyed with its reason", async () => {
    const onStart = vi.fn();
    render(<Empty canShareScreen={false} onStart={onStart} />);

    const [first, second] = screen.getAllByRole("button");
    expect(first).toHaveAccessibleName(/Turn on your camera/);
    expect(second).toHaveAttribute("aria-disabled", "true");
    expect(second).toHaveAccessibleDescription("This browser can't share a screen");
    await userEvent.setup().click(screen.getByRole("button", { name: "Share your screen" }));
    expect(onStart).not.toHaveBeenCalled();
  });

  it("says one short line, and greys the screen it can't share as the same pill, saying why", () => {
    const { rerender } = render(<Empty />);
    // An invitation, not an order, wherever it is.
    expect(screen.getByText("What's on today?")).toBeInTheDocument();
    expect(screen.queryByText(/or turn on your camera/i)).not.toBeInTheDocument();
    rerender(<Empty canShareScreen={false} />);
    expect(screen.getByText("What's on today?")).toBeInTheDocument();
    expect(screen.queryByText(/turn on your camera\./i)).not.toBeInTheDocument();
    // No "and the room sees it at once": it says what to do, not what follows.
    expect(screen.queryByText(/room sees/)).not.toBeInTheDocument();
    // The same pill as where it can be shared, greyed, still saying why.
    const greyed = screen.getByRole("button", { name: "Share your screen" });
    expect(greyed).toHaveTextContent("Screen");
    expect(greyed).toHaveAccessibleDescription("This browser can't share a screen");
  });

  it("has four viewfinder corners, the top right red, and only a still 'Standby'", () => {
    const { container } = render(<Empty />);
    const display = container.firstElementChild as HTMLElement;
    const corners = [...display.querySelectorAll("[data-at]")].filter((c) => c.getAttribute("aria-hidden") === "true");
    expect(corners.map((c) => c.getAttribute("data-at"))).toEqual(["tl", "tr", "bl", "br"]);
    expect(within(display).getByText("Standby")).toBeInTheDocument();
    // The camera display's clutter is gone: no clock, room, format, frame rate or signal.
    expect(display).not.toHaveTextContent(/\d\d:\d\d|Room 01|16:9|HD|fps|Online/);
  });

  it("says nothing the row below says: no names, no seats, no 'nobody'", () => {
    const { container } = render(<Empty />);
    expect(container).not.toHaveTextContent(/here|seat|of 6|nobody/i);
  });

  it("says when it stands by, and turns the TV on only when asked, never for reduced motion", () => {
    vi.spyOn(window, "matchMedia").mockImplementation((q: string) => ({ matches: false, media: q }) as MediaQueryList);
    const onStandby = vi.fn();
    const first = render(<StageEmptyStage turnOn onStandby={onStandby} />);
    expect(onStandby).toHaveBeenCalledTimes(1);
    expect(first.container.querySelector('[class*="intro"]')).not.toBeNull();
    first.unmount();
    const again = render(<StageEmptyStage turnOn={false} onStandby={onStandby} />);
    expect(again.container.querySelector('[class*="intro"]')).toBeNull();
  });
});
