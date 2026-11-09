import { act, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { aUser, installFakeApi, someoneSharing } from "../../../../testing/fakeApi";
import { onFakeClock } from "../../../../testing/factories/clock.factory";
import { renderInRoom } from "../../../../testing/factories/room-render.factory";
import { useRoomSession } from "./hooks/use-room-session.hook";

beforeEach(() => {
  onFakeClock();
});

/** Shows what an area reads, and opens the settings from my buttons as the cog does. */
function Reader() {
  const { header, stage, settings } = useRoomSession();
  return (
    <>
      <p>{`on stage: ${stage.stage.big?.person.name ?? "nobody"}`}</p>
      <p>{`people: ${header.people.people.length}`}</p>
      <p>{`settings: ${settings.open ? "open" : "closed"}`}</p>
      <button type="button" onClick={stage.controls.onSettings}>
        Cog
      </button>
    </>
  );
}

describe("the room's session", () => {
  it("gives each area its part of the room once I'm in, and the settings follow my buttons", async () => {
    const server = installFakeApi({ me: aUser({ name: "Henrique Brauveres", status: "MEMBER" }) });
    server.streams = [someoneSharing("Bruno")];
    renderInRoom(<Reader />);
    expect(await screen.findByText("on stage: Bruno")).toBeInTheDocument();
    expect(screen.getByText(/^people: \d+$/)).toBeInTheDocument();
    expect(screen.getByText("settings: closed")).toBeInTheDocument();
    act(() => screen.getByRole("button", { name: "Cog" }).click());
    expect(screen.getByText("settings: open")).toBeInTheDocument();
  });
});
