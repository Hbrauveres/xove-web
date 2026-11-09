import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { aRoomSession } from "../../../../testing/factories/room-session.factory";
import { RoomSessionContext } from "../../stores/room-session";
import { Header } from "./header.component";

describe("the room's header", () => {
  it("is a banner with the logo, the activity, then the people and my account", () => {
    render(
      <RoomSessionContext.Provider value={aRoomSession()}>
        <Header />
      </RoomSessionContext.Provider>,
    );
    const header = screen.getByRole("banner");
    expect(within(header).getByLabelText("Xovê")).toBeInTheDocument();
    const names = within(header)
      .getAllByRole("button")
      .map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(names).toHaveLength(3);
    expect(names[0]).toMatch(/^Activity/);
    expect(names[1]).toMatch(/(person|people) here$/);
    expect(names[2]).toMatch(/: account/);
  });
});
