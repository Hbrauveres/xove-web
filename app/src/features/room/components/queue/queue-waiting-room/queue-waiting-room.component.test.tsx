import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RoomSeat } from "../../../types/room.types";
import { QueueWaitingRoom } from "./queue-waiting-room.component";

/** My seat in the queue, its actions as spies. */
function aSeat(over: Partial<RoomSeat> = {}): RoomSeat {
  return {
    status: { status: "waiting", place: 2 },
    error: null,
    accept: vi.fn(),
    cancel: vi.fn(),
    rejoin: vi.fn(),
    ...over,
  };
}

describe("the waiting room", () => {
  it("says my place in a live card, with Sign out under it", () => {
    const onSignOut = vi.fn();
    render(<QueueWaitingRoom seat={aSeat()} onSignOut={onSignOut} />);
    expect(screen.getByRole("status")).toHaveTextContent("You're number 2 in line.");
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it("joins the queue again after I left it, and says a failed request", () => {
    const seat = aSeat({ status: { status: "left" }, error: "Couldn't reach the room." });
    render(<QueueWaitingRoom seat={seat} onSignOut={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Join the queue again" }));
    expect(seat.rejoin).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toHaveTextContent("Couldn't reach the room.");
  });

  it("shows the offer over it when a seat frees, and Enter room takes it", () => {
    const seat = aSeat({ status: { status: "offered", until: "", seconds: 60 } });
    render(<QueueWaitingRoom seat={seat} onSignOut={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Enter room" }));
    expect(seat.accept).toHaveBeenCalledOnce();
  });
});
