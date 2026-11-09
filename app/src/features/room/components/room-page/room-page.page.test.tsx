import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@shared/stores/auth-store";
import { aUser, installFakeApi, someoneSharing } from "../../../../testing/fakeApi";
import { lastRoom } from "../../../../testing/fakeLiveKit";
import { clockUser, onFakeClock } from "../../../../testing/factories/clock.factory";
import { RoomPage } from "./room-page.page";
const member = () => aUser({ name: "Henrique Brauveres", status: "MEMBER" });
const FAST_POLL = 50;

// Every test runs on a fake, fixed clock: nothing waits in real time, and Testing Library's
// findBy and waitFor move the clock on themselves (src/testing/setup.ts).
beforeEach(() => {
  onFakeClock();
});

/** Moves the fake clock on, and lets what was waiting on it happen. */
const pass = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

/** The room on its own, polling fast so tests don't wait 2 seconds. */
function renderRoom() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <RoomPage pollMs={FAST_POLL} />
      </AuthProvider>
    </MemoryRouter>,
  );
}

// The account button's dot says the connection.
const connected = () => screen.findByRole("button", { name: /: account, connected$/ });
// The stage: the picture, and my screen and camera buttons on it.
const stage = () => screen.getByRole("region", { name: /shared screen/i });

describe("room: joining the video room", () => {
  it("says so when video isn't available, and the rest of the room still works", async () => {
    const server = installFakeApi({ me: member() });
    server.failures.set("POST /api/livekit/token", {
      status: 503,
      body: { status: 503, detail: "Video isn't set up on this server yet." },
    });
    renderRoom();

    expect(await screen.findByRole("alert")).toHaveTextContent("Video isn't set up on this server yet.");
    // The account button's dot and name say it.
    expect(screen.getByRole("button", { name: /: account, disconnected$/ })).toBeInTheDocument();
    expect(screen.getByLabelText("0 of 6 live, 6 seats open")).toBeInTheDocument();
  });

  it("lists the people connected, and notes who joins and leaves", async () => {
    installFakeApi({ me: member() });
    renderRoom();
    await connected();

    act(() => {
      lastRoom().join("user-7", "Bruno Lima");
    });
    // The people button counts them; its panel names them.
    const user = clockUser();
    await user.click(screen.getByRole("button", { name: "2 people here" }));
    expect(within(screen.getByRole("dialog", { name: "Here now" })).getByText("Bruno")).toBeInTheDocument();
    // The activity pill shows the latest event.
    expect(screen.getByRole("button", { name: /^Activity: Bruno joined/ })).toBeInTheDocument();

    act(() => {
      lastRoom().leave("user-7");
    });
    expect(screen.getByRole("button", { name: "1 person here" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Activity: Bruno left/ })).toBeInTheDocument();
  });
});

describe("room: waiting for a seat", () => {
  const offered = (seconds: number) =>
    ({ status: "offered", until: new Date(Date.now() + seconds * 1000).toISOString(), seconds }) as const;

  it("waits with its place in the queue when the room is full, without joining the video", async () => {
    const server = installFakeApi({ me: member() });
    server.seat = { status: "waiting", place: 3 };
    renderRoom();

    expect(await screen.findByText(/you're number 3 in line/i)).toBeInTheDocument();
    expect(server.calls.some((c) => c.path === "/api/livekit/token")).toBe(false);

    act(() => {
      server.seat = { status: "waiting", place: 1 };
    });
    expect(await screen.findByText(/you're next/i)).toBeInTheDocument();
  });

  it("lists the devices while I wait, and the page's sound unlocks with a click once I'm in", async () => {
    const list = vi.spyOn(navigator.mediaDevices, "enumerateDevices");
    const server = installFakeApi({ me: member() });
    server.seat = { status: "waiting", place: 1 };
    renderRoom();
    await screen.findByText(/you're next/i);
    expect(list).toHaveBeenCalled();

    act(() => {
      server.seat = { status: "in" };
      server.seated = true;
    });
    await connected();
    fireEvent.pointerUp(document.body);
    expect(lastRoom().startAudio).toHaveBeenCalled();
  });

  it("offers the seat in a popup with a countdown, and Enter room takes it", async () => {
    const server = installFakeApi({ me: member() });
    server.seat = { status: "waiting", place: 1 };
    renderRoom();
    await screen.findByText(/you're next/i);

    act(() => {
      server.seat = offered(60);
    });

    const offer = await screen.findByRole("dialog", { name: /it's your turn/i });
    expect(offer).toHaveTextContent("60 seconds");
    await waitFor(() => expect(document.title).toBe("Your turn — Xovê"));
    expect(within(offer).getByRole("button", { name: /enter room/i })).toHaveFocus();

    await clockUser().click(within(offer).getByRole("button", { name: /enter room/i }));

    await connected();
    expect(server.calls.some((c) => c.method === "POST" && c.path === "/api/room/accept")).toBe(true);
    expect(document.title).not.toBe("Your turn — Xovê");
  });

  it("leaves the queue on Cancel, and can join it again", async () => {
    const server = installFakeApi({ me: member() });
    server.seat = offered(60);
    renderRoom();
    const offer = await screen.findByRole("dialog", { name: /it's your turn/i });
    const user = clockUser();

    await user.click(within(offer).getByRole("button", { name: /cancel/i }));

    expect(await screen.findByText(/you left the queue/i)).toBeInTheDocument();
    expect(server.calls.some((c) => c.method === "POST" && c.path === "/api/room/cancel")).toBe(true);
    const polls = server.calls.filter((c) => c.path === "/api/room/enter").length;
    await pass(FAST_POLL * 3);
    expect(server.calls.filter((c) => c.path === "/api/room/enter")).toHaveLength(polls);

    server.seat = { status: "waiting", place: 4 };
    await user.click(screen.getByRole("button", { name: /join the queue again/i }));
    expect(await screen.findByText(/you're number 4 in line/i)).toBeInTheDocument();
  });

  it("goes back to waiting when the offer runs out", async () => {
    const server = installFakeApi({ me: member() });
    server.seat = offered(1);
    renderRoom();
    await screen.findByRole("dialog", { name: /it's your turn/i });

    act(() => {
      server.seat = { status: "waiting", place: 2 };
    });

    expect(await screen.findByText(/you're number 2 in line/i)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

// ---- cameras ----

describe("room: theater mode", () => {
  it("has no sidebar or old header: a logo, the activity pill, people and account up top, and the footer", async () => {
    installFakeApi({ me: member() });
    renderRoom();
    await connected();

    const header = screen.getByRole("banner");
    // The drawn mark, not the name typed as text.
    expect(within(header).getByLabelText("Xovê")).toBeInTheDocument();
    expect(within(header).queryByText(/xovê/)).not.toBeInTheDocument();
    expect(within(header).getByRole("button", { name: /^Activity/ })).toBeInTheDocument();
    expect(within(header).getByRole("button", { name: "1 person here" })).toBeInTheDocument();
    expect(within(header).getByRole("button", { name: /: account, connected$/ })).toBeInTheDocument();
    expect(screen.queryByText("xove.app")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /here now/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent("xovê · Made by Hbrauveres");
    expect(footer).toHaveTextContent(/Buy me a coffee.*GitHub.*LinkedIn/);
    expect(within(footer).queryByRole("link")).not.toBeInTheDocument();
  });

  it("puts a stream from the activity list on the stage, a camera event with the camera big", async () => {
    const server = installFakeApi({ me: member() });
    renderRoom();
    await connected();
    act(() => {
      server.streams = [someoneSharing("Bruno Lima", 7, "screen"), someoneSharing("Bruno Lima", 7, "camera")];
    });
    await screen.findByRole("heading", { name: "Bruno" });
    act(() => {
      lastRoom().join("user-7", "Bruno Lima");
      lastRoom().publishScreen("user-7");
      lastRoom().publishCamera("user-7");
    });
    const user = clockUser();

    await user.click(screen.getByRole("button", { name: /^Activity/ }));
    await user.click(screen.getByRole("button", { name: "Bruno turned on their camera, now: watch" }));

    // Camera big, screen in the small view.
    await waitFor(() => expect(stage().querySelector("[aria-roledescription='small view']")).not.toBeNull());
    expect(
      within(stage().querySelector("[aria-roledescription='small view']") as HTMLElement).getByLabelText(
        "Bruno's shared screen",
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Activity" })).not.toBeInTheDocument());
  });

  it("shows who watches what in the people panel", async () => {
    const server = installFakeApi({ me: member() });
    server.streams = [someoneSharing("Bruno Lima", 7)];
    server.watching = [{ userId: 3, sharerId: 7, kind: "screen", mine: false }];
    renderRoom();
    await connected();
    act(() => {
      lastRoom().join("user-3", "Ana Souza");
      lastRoom().join("user-7", "Bruno Lima");
      lastRoom().publishScreen("user-7");
    });
    const user = clockUser();

    await user.click(screen.getByRole("button", { name: /people here/ }));

    const panel = screen.getByRole("dialog", { name: "Here now" });
    await waitFor(() => expect(within(panel).getByText("Watching Bruno", { selector: "small" })).toBeInTheDocument());
  });
});

// ---- across the areas: the page itself, the activity, and the room's errors ----

/** The room, connected, with a free stage (the seats box says "0 of 6 live": quicker than a heading by role). */
async function readyRoom() {
  renderRoom();
  await connected();
  await screen.findByLabelText("0 of 6 live, 6 seats open");
  return clockUser();
}

type User = ReturnType<typeof clockUser>;
/** Clicks "Share your screen": the browser's picker, and the pick is sent at once. */
async function pickScreen(user: User, button: RegExp = /share your screen/i) {
  await user.click(within(stage()).getByRole("button", { name: button }));
}

describe("room: watching", () => {
  it("marks the page as the room, which turns off pull-to-refresh only here", async () => {
    installFakeApi({ me: member() });
    renderRoom();

    await screen.findByRole("heading", { name: "Nobody is sharing yet" });
    expect(document.querySelector("[data-room]")).not.toBeNull();
  });

  it("picks up a new sharer from the API without reloading", async () => {
    const server = installFakeApi({ me: member() });
    renderRoom();
    expect(await screen.findByLabelText("0 of 6 live, 6 seats open")).toBeInTheDocument();
    // "0 of 6 live" shows before the first answer too; the feed only logs changes
    // after it, so wait until it's in. The fake answers at once, so by the second
    // poll the first answer has arrived, and act() below renders it first.
    await waitFor(() =>
      expect(server.calls.filter((c) => c.method === "GET" && c.path === "/api/streams").length).toBeGreaterThan(1),
    );

    act(() => {
      server.streams = [someoneSharing("Duda", 9)];
    });

    expect(await screen.findByRole("heading", { name: "Duda" })).toBeInTheDocument();
    expect(await screen.findByText(/duda started sharing/i)).toBeInTheDocument();
  });
});

describe("room: sharing", () => {
  it("shows the API's message when starting the stream fails, and stops the video", async () => {
    const server = installFakeApi({ me: member() });
    server.failures.set("POST /api/streams", {
      status: 403,
      body: { status: 403, detail: "Members only" },
    });
    const user = await readyRoom();
    await pickScreen(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("Members only");
    expect(lastRoom().localParticipant.isScreenShareEnabled).toBe(false);
  });
});

describe("room: starting from fullscreen", () => {
  /** Plays the browser putting the stage's player in fullscreen (jsdom has none). */
  function enterFullscreen() {
    const frame = stage().querySelector("[class*='frame']") as HTMLElement;
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => frame });
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    return frame;
  }
  it("shows a failed start over the fullscreen player too", async () => {
    installFakeApi({ me: member() });
    const user = await readyRoom();
    const frame = enterFullscreen();
    lastRoom().localParticipant.nextPicker = "no-video";

    await user.click(within(stage()).getByRole("button", { name: /share your screen/i }));

    expect(frame).toContainElement(await screen.findByRole("alert"));
  });
});
