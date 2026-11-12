import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { aRoomSession } from "../../../../../testing/factories/room-session.factory";
import { RoomSessionContext } from "../../../stores/room-session";
import { RoomError } from "./room-error.component";

/** The browser says which element is fullscreen; jsdom has none of its own. */
function goFullscreen(element: Element | null) {
  Object.defineProperty(document, "fullscreenElement", { configurable: true, value: element });
  act(() => {
    document.dispatchEvent(new Event("fullscreenchange"));
  });
}

const inRoom = (error: string | null) => (
  <RoomSessionContext.Provider value={aRoomSession({ error })}>
    <main>
      <RoomError />
    </main>
  </RoomSessionContext.Provider>
);

afterEach(() => {
  goFullscreen(null);
  document.querySelector("[data-player]")?.remove();
});

describe("the room's error", () => {
  it("says nothing while all is well", () => {
    render(inRoom(null));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("says the problem in the room, over the middle", () => {
    render(inRoom("The room is unreachable"));
    expect(screen.getByRole("main")).toHaveTextContent("The room is unreachable");
  });

  it("goes over the player in fullscreen, where nothing else can be seen", () => {
    const player = document.createElement("div");
    player.setAttribute("data-player", "");
    document.body.appendChild(player);
    goFullscreen(player);
    render(inRoom("The room is unreachable"));
    expect(screen.getByRole("main")).not.toHaveTextContent("The room is unreachable");
    expect(player).toHaveTextContent("The room is unreachable");
  });
});
