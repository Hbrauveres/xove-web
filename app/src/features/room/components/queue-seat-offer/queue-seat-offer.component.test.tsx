import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { onFakeClock } from "../../../../testing/factories/clock.factory";
import { QueueSeatOffer } from "./queue-seat-offer.component";

beforeEach(() => {
  onFakeClock();
});

/** The offer with its two actions as spies. */
function renderOffer(seconds = 60) {
  const onEnter = vi.fn();
  const onCancel = vi.fn();
  const view = render(<QueueSeatOffer seconds={seconds} onEnter={onEnter} onCancel={onCancel} />);
  return { onEnter, onCancel, view };
}

const offer = () => screen.getByRole("dialog", { name: "It's your turn" });

describe("the seat offer", () => {
  it("opens as a modal dialog with Enter room focused, the time running down", () => {
    renderOffer(60);
    expect(offer()).toHaveAttribute("open");
    expect(offer()).toHaveTextContent("Enter within 60 seconds");
    expect(screen.getByRole("button", { name: "Enter room" })).toHaveFocus();
    act(() => vi.advanceTimersByTime(3000));
    expect(offer()).toHaveTextContent("Enter within 57 seconds");
  });

  it("enters with Enter room, and cancels with Cancel or the dialog's Escape", () => {
    const { onEnter, onCancel } = renderOffer();
    fireEvent.click(screen.getByRole("button", { name: "Enter room" }));
    expect(onEnter).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    // The browser turns Escape into the dialog's cancel event.
    fireEvent(offer(), new Event("cancel", { cancelable: true }));
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(offer()).toHaveAttribute("open");
  });

  it("keeps Tab between its two buttons, both ways", () => {
    renderOffer();
    const enter = screen.getByRole("button", { name: "Enter room" });
    const cancel = screen.getByRole("button", { name: "Cancel" });
    cancel.focus();
    fireEvent.keyDown(offer(), { key: "Tab" });
    expect(enter).toHaveFocus();
    fireEvent.keyDown(offer(), { key: "Tab", shiftKey: true });
    expect(cancel).toHaveFocus();
  });

  it("says it's my turn in the tab's title while it shows, and gives the title back after", () => {
    document.title = "Xovê";
    const { view } = renderOffer();
    expect(document.title).toBe("Your turn — Xovê");
    view.unmount();
    expect(document.title).toBe("Xovê");
  });
});
