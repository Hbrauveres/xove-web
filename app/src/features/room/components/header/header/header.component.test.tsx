import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { aRoomSession } from "../../../../../testing/factories/room-session.factory";
import { RoomSessionContext } from "../../../stores/room-session";
import { Header } from "./header.component";
import { aUser, installFakeApi } from "../../../../../testing/fakeApi";
import { clockUser, onFakeClock } from "../../../../../testing/factories/clock.factory";
import { loadAmbilight } from "@services/preferences-service";
import { renderInRoom } from "../../../../../testing/factories/room-render.factory";
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

// The wiring: the header over the real room session.
const member = () => aUser({ name: "Henrique Brauveres", status: "MEMBER" });

// The account button's dot says the connection.
const connected = () => screen.findByRole("button", { name: /: account, connected$/ });

/** The header over the real room session, on the fake API and LiveKit. */
const renderRoom = () => renderInRoom(<Header />);

describe("room: my menu", () => {
  beforeEach(() => {
    onFakeClock();
  });

  it("remembers the ambilight's switch for next time", async () => {
    installFakeApi({ me: member() });
    renderRoom();
    const user = clockUser();
    await user.click(await connected());
    await user.click(screen.getByRole("switch", { name: "Ambilight" }));

    expect(screen.getByRole("switch", { name: "Ambilight" })).not.toBeChecked();
    expect(loadAmbilight().on).toBe(false);
  });
});
