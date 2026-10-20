import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cameraCaptureOptions, cameraPublishOptions, capOf, screenCaptureRequest, screenPublishOptions } from "../media/shareSettings";
import { AuthProvider } from "../auth/AuthProvider";
import { aUser, installFakeApi, MY_USER_ID, myLiveStream, someoneSharing } from "../test/fakeApi";
import { FakeLocalScreenTrack, lastRoom } from "../test/fakeLiveKit";
import { NARROW_UPRIGHT_QUERY, PORTRAIT_QUERY, SMALL_QUERY, TOUCH_QUERY } from "../hooks/useRoomLayout";
import { RoomPage } from "./RoomPage";

const member = aUser({ name: "Henrique Brauveres", status: "MEMBER" });
const FAST_POLL = 50;
const myOldStream = () => ({ ...someoneSharing("Henrique"), userId: MY_USER_ID });

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

// My screen and camera buttons sit on the stage (spec 0098).
const controls = () => screen.getByRole("region", { name: /shared screen/i });
// The account button's dot says the connection (spec 0104).
const connected = () => screen.findByRole("button", { name: /: account, connected$/ });
const stage = () => screen.getByRole("region", { name: /shared screen/i });

describe("room: joining the video room", () => {
  it("connects to LiveKit with the address and token from the API", async () => {
    installFakeApi({ me: member });
    renderRoom();

    await connected();
    expect(lastRoom().connectedWith).toEqual({ url: "wss://rtc.test", token: "test-token" });
  });

  it("says so when video isn't available, and the rest of the room still works", async () => {
    const server = installFakeApi({ me: member });
    server.failures.set("POST /api/livekit/token", {
      status: 503,
      body: { status: 503, detail: "Video isn't set up on this server yet." },
    });
    renderRoom();

    expect(await screen.findByRole("alert")).toHaveTextContent("Video isn't set up on this server yet.");
    // The account button's dot and name say it (spec 0104).
    expect(screen.getByRole("button", { name: /: account, disconnected$/ })).toBeInTheDocument();
    expect(screen.getByLabelText("0 of 6 live, 6 seats open")).toBeInTheDocument();
  });

  it("lists the people connected, and notes who joins and leaves", async () => {
    installFakeApi({ me: member });
    renderRoom();
    await connected();

    act(() => {
      lastRoom().join("user-7", "Bruno Lima");
    });
    // The people button counts them; its panel names them (spec 0104).
    const user = userEvent.setup();
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

describe("room: watching", () => {
  it("shows a free stage when nobody is sharing", async () => {
    installFakeApi({ me: member });
    renderRoom();

    expect(await screen.findByRole("heading", { name: "Nobody is sharing yet" })).toBeInTheDocument();
  });

  it("marks the page as the room, which turns off pull-to-refresh only here", async () => {
    installFakeApi({ me: member });
    renderRoom();

    await screen.findByRole("heading", { name: "Nobody is sharing yet" });
    expect(document.querySelector("[data-room]")).not.toBeNull();
  });

  it("plays the sharer's screen once their video arrives", async () => {
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Bruno Lima", 7)];
    renderRoom();
    await connected();

    expect(await screen.findByRole("heading", { name: "Bruno" })).toBeInTheDocument();
    expect(screen.getByText(/loading bruno's screen/i)).toBeInTheDocument();

    let track!: ReturnType<ReturnType<typeof lastRoom>["publishScreen"]>;
    act(() => {
      track = lastRoom().publishScreen("user-7");
    });

    const video = await screen.findByLabelText("Bruno's shared screen");
    expect(track.attached).toContain(video);
  });

  it("picks up a new sharer from the API without reloading", async () => {
    const server = installFakeApi({ me: member });
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

  // Spec 0038, AC-8: the API ends the stream when LiveKit says the sharer left.
  it("logs 'stopped sharing' when the stream ends from outside", async () => {
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Ana Souza", 7)];
    renderRoom();
    expect(await screen.findByRole("heading", { name: "Ana" })).toBeInTheDocument();

    act(() => {
      server.streams = [];
    });

    expect(await screen.findByLabelText("0 of 6 live, 6 seats open")).toBeInTheDocument();
    expect(await screen.findByText(/ana stopped sharing/i)).toBeInTheDocument();
  });
});

// ---- sharing: pick a screen, set it up, start (spec 0086) ----

/** The room, connected, with a free stage (the seats box says "0 of 6 live": quicker than a heading by role). */
async function readyRoom() {
  renderRoom();
  await connected();
  await screen.findByLabelText("0 of 6 live, 6 seats open");
  return userEvent.setup();
}

type User = ReturnType<typeof userEvent.setup>;
/** Clicks "Share your screen": the browser's picker, and the pick is sent at once (spec 0107). */
async function pickScreen(user: User, button: RegExp = /share your screen/i) {
  await user.click(within(controls()).getByRole("button", { name: button }));
}

/** Picks a screen and starts sharing it, with the remembered settings. */
async function startSharing(user: User) {
  await pickScreen(user);
  await screen.findByRole("heading", { name: "You" });
}

type MenuKind = "Screen" | "Camera" | "Voice";

/** The settings panel on a tab (spec 0107): opened from the cog when it isn't. */
async function openMenu(user: User, kind: MenuKind = "Screen") {
  if (!screen.queryByRole("dialog", { name: "Settings" })) {
    await user.click(within(controls()).getByRole("button", { name: "Settings" }));
  }
  const panel = within(screen.getByRole("dialog", { name: "Settings" }));
  const tab = panel.getByRole("tab", { name: (name) => name.startsWith(kind) });
  if (tab.getAttribute("aria-selected") !== "true") await user.click(tab);
  return within(panel.getByRole("tabpanel"));
}

/** Picks a quality or mode in the settings, on that stream's tab. */
async function pickInMenu(user: User, option: string, kind: MenuKind = "Screen") {
  await user.click((await openMenu(user, kind)).getByRole("radio", { name: option }));
}

/** The quality chosen on the settings' open tab. */
const tickedQuality = (kind: MenuKind = "Screen") =>
  within(screen.getByRole("radiogroup", { name: `${kind} quality` }))
    .getAllByRole("radio")
    .find((r) => r.getAttribute("aria-checked") === "true")?.textContent;

describe("room: sharing", () => {
  afterEach(() => localStorage.clear());

  // Spec 0107, AC-3: no setup window.
  it("starts at once with the defaults the first time, sending the CSRF token, the kind, the connection and the settings", async () => {
    document.cookie = "XSRF-TOKEN=abc123";
    const server = installFakeApi({ me: member });
    const user = await readyRoom();

    await pickScreen(user);

    expect(await screen.findByRole("heading", { name: "You" })).toBeInTheDocument();
    const local = lastRoom().localParticipant;
    expect(local.getDisplayMedia).toHaveBeenCalledTimes(1);
    expect(local.publishTrack).toHaveBeenCalled();
    const take = server.calls.find((c) => c.method === "POST" && c.path === "/api/streams");
    expect(take?.headers["X-XSRF-TOKEN"]).toBe("abc123");
    expect(take?.body).toEqual({ kind: "screen", participantSid: "PA_me", trackSid: "TR_my_screen", quality: "1080p", mode: "smooth" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("names what's shared by what the browser says was picked: a tab, a window, the whole screen", async () => {
    installFakeApi({ me: member });
    const user = await readyRoom();
    lastRoom().localParticipant.nextSurface = "browser";
    await startSharing(user);

    const tab = await openMenu(user);
    expect(tab.getByText("A tab")).toBeInTheDocument();
  });

  it("starts with the settings remembered from last time", async () => {
    localStorage.setItem("xove.share.quality", "720p");
    localStorage.setItem("xove.share.mode", "sharp");
    const server = installFakeApi({ me: member });
    const user = await readyRoom();

    await startSharing(user);

    const take = server.calls.find((c) => c.method === "POST" && c.path === "/api/streams");
    expect(take?.body).toMatchObject({ kind: "screen", quality: "720p", mode: "sharp" });
    expect((lastRoom().localParticipant.lastCapture[0] as FakeLocalScreenTrack).setPublishingQuality).toHaveBeenLastCalledWith(capOf("720p"));
  });

  it("does nothing if the picker is closed without choosing", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    lastRoom().localParticipant.nextPicker = "cancel";

    await user.click(within(controls()).getByRole("button", { name: /share your screen/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText("0 of 6 live, 6 seats open")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(server.calls.some((c) => c.path === "/api/streams" && c.method === "POST")).toBe(false);
  });

  it("says so when the browser gives no screen", async () => {
    installFakeApi({ me: member });
    const user = await readyRoom();
    lastRoom().localParticipant.nextPicker = "no-video";

    await user.click(within(controls()).getByRole("button", { name: /share your screen/i }));

    expect(await screen.findByText("Couldn't start sharing your screen.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(lastRoom().localParticipant.publishTrack).not.toHaveBeenCalled();
  });

  // A browser without a picker at all never shows the button (StreamButtons.test); here the
  // picker is there but fails. Removing the picker instead raced the room's next render,
  // which hides the button (it failed on CI's slower machine).
  it("says so when the browser's picker fails", async () => {
    installFakeApi({ me: member });
    const user = await readyRoom();
    lastRoom().localParticipant.getDisplayMedia.mockImplementation(async () => {
      throw new TypeError("getDisplayMedia is not supported here");
    });

    await user.click(within(controls()).getByRole("button", { name: /share your screen/i }));

    expect(await screen.findByText("Couldn't start sharing your screen.")).toBeInTheDocument();
    expect(lastRoom().localParticipant.publishTrack).not.toHaveBeenCalled();
  });

  it("stops sharing and says so when the screen track can't be identified", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    lastRoom().localParticipant.screenTrackSid = undefined;
    await pickScreen(user);

    expect(await screen.findByText(/couldn't start sharing your screen/i)).toBeInTheDocument();
    expect(lastRoom().localParticipant.isScreenShareEnabled).toBe(false);
    expect(server.calls.some((c) => c.path === "/api/streams" && c.method === "POST")).toBe(false);
  });

  // Spec 0060: several screens at once, nobody is pushed out.
  it("shares alongside someone else, without asking anyone to stop", async () => {
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Bruno", 7)];
    renderRoom();
    await connected();
    await screen.findByRole("heading", { name: "Bruno" });
    const user = userEvent.setup();

    // Watching someone, not live: Go live opens the ways to start (spec 0123).
    await user.click(within(controls()).getByRole("button", { name: "Go live" }));
    await user.click(within(controls()).getByRole("menuitem", { name: /share your screen/i }));

    await waitFor(() => expect(myLiveStream(server)).toBeDefined());
    expect(server.streams.map((st) => st.userId)).toEqual([7, MY_USER_ID]);
  });

  it("stops the video and ends the stream", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);

    await user.click(within(controls()).getByRole("button", { name: /stop sharing/i }));

    expect(await screen.findByLabelText("0 of 6 live, 6 seats open")).toBeInTheDocument();
    expect(lastRoom().localParticipant.isScreenShareEnabled).toBe(false);
    expect(myLiveStream(server)).toBeUndefined();
  });

  it("shows the static with no turn-on when the last stream stops: the TV is already on (spec 0136)", async () => {
    installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);
    await user.click(within(controls()).getByRole("button", { name: /stop sharing/i }));

    expect(await screen.findByRole("heading", { name: "Go live" })).toBeInTheDocument();
    expect(document.querySelector('[class*="intro"]')).toBeNull();
    expect(document.querySelector('[class*="flash"]')).toBeNull();
  });

  it("puts the settings beside the ways to start when nobody is live, not in a corner (spec 0138)", async () => {
    installFakeApi({ me: member });
    renderRoom();
    await connected();
    const empty = await waitFor(() => stage().querySelector<HTMLElement>("[data-empty]")!);
    // The row: Screen, Camera, then the cog; the stage's own controls hold no cog.
    expect(within(empty).getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual([
      "Share your screen",
      "Turn on your camera",
      "Settings",
    ]);
    expect(within(stage()).getAllByRole("button", { name: "Settings" })).toHaveLength(1);
    await userEvent.setup().click(within(empty).getByRole("button", { name: "Settings" }));
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
  });

  it("ends the stream when the browser's own Stop sharing bar is used", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);

    act(() => {
      lastRoom().browserStopsMyShare();
    });

    await waitFor(() => expect(myLiveStream(server)).toBeUndefined());
    expect(await screen.findByLabelText("0 of 6 live, 6 seats open")).toBeInTheDocument();
  });

  // AC-1: six streams at once; a seventh can't start, and the buttons say why.
  it("says the room is full of streams, and waits for a free place", async () => {
    const server = installFakeApi({ me: member });
    server.streams = [1, 2, 3].flatMap((id) => [
      someoneSharing(`P${id}`, id, "screen"),
      someoneSharing(`P${id}`, id, "camera"),
    ]);
    renderRoom();
    await connected();

    // Go live's ways to start are greyed out, still focusable, with the reason in their tooltip.
    const user = userEvent.setup();
    await user.click(await within(controls()).findByRole("button", { name: "Go live" }));
    const share = () => within(controls()).getByRole("menuitem", { name: /share your screen/i });
    await waitFor(() => expect(share()).toHaveAttribute("aria-disabled", "true"));
    expect(share()).toHaveAccessibleDescription(expect.stringMatching(/6 streams are live/i));
    expect(within(controls()).getByRole("menuitem", { name: /turn on your camera/i })).toHaveAttribute("aria-disabled", "true");

    act(() => {
      server.streams = server.streams.slice(1);
    });

    await waitFor(() => expect(share()).not.toHaveAttribute("aria-disabled"));
  });

  // Every deploy restarts the API, which forgets the streams: mine is registered again.
  it("registers my screen again when the API forgot it", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);

    act(() => {
      server.streams = [];
    });

    await waitFor(() => expect(server.calls.filter((c) => c.method === "POST" && c.path === "/api/streams")).toHaveLength(2));
    const again = server.calls.filter((c) => c.method === "POST" && c.path === "/api/streams").at(-1);
    expect(again?.body).toEqual({ kind: "screen", participantSid: "PA_me", trackSid: "TR_my_screen", quality: "1080p", mode: "smooth" });
    expect(myLiveStream(server)).toBeDefined();
    expect(lastRoom().localParticipant.isScreenShareEnabled).toBe(true);
  });

  it("stops my screen when the places filled up while the API forgot it", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);

    act(() => {
      server.streams = [1, 2, 3, 4, 5, 6].map((id) => someoneSharing(`P${id}`, id));
    });

    await waitFor(() => expect(lastRoom().localParticipant.isScreenShareEnabled).toBe(false));
    expect(await screen.findByRole("alert")).toHaveTextContent("The room already has 6 streams.");
  });

  it("ends my stream after a reload, when nothing is being sent", async () => {
    const server = installFakeApi({ me: member });
    server.streams = [myOldStream()];
    renderRoom();

    await waitFor(() => expect(myLiveStream(server)).toBeUndefined());
    expect(await screen.findByLabelText("0 of 6 live, 6 seats open")).toBeInTheDocument();
  });

  it("shows the API's message when starting the stream fails, and stops the video", async () => {
    const server = installFakeApi({ me: member });
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

describe("room: what the screen is sent with", () => {
  afterEach(() => localStorage.clear());

  it("captures the best quality and sends it with the mode's settings, capped at the chosen quality", async () => {
    localStorage.setItem("xove.share.quality", "720p");
    installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);

    const local = lastRoom().localParticipant;
    // The browser is asked directly: livekit-client would drop `windowAudio` (spec 0095).
    expect(local.getDisplayMedia).toHaveBeenCalledWith(screenCaptureRequest());
    const [video, sound] = local.lastCapture;
    expect([video.source, sound.source]).toEqual(["screen_share", "screen_share_audio"]);
    expect(lastRoom().startAudio).toHaveBeenCalled();
    expect(local.publishTrack).toHaveBeenCalledWith(video, { ...screenPublishOptions("smooth"), source: "screen_share" });
    expect(local.publishTrack).toHaveBeenCalledWith(sound, { ...screenPublishOptions("smooth"), source: "screen_share_audio" });
    expect(video.mediaStreamTrack.contentHint).toBe("motion");
    expect((video as FakeLocalScreenTrack).setPublishingQuality).toHaveBeenLastCalledWith(capOf("720p"));
  });

  it("sends Sharp as detail, at the quality remembered from last time", async () => {
    localStorage.setItem("xove.share.quality", "480p");
    localStorage.setItem("xove.share.mode", "sharp");
    installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);

    expect(lastRoom().localParticipant.getDisplayMedia).toHaveBeenCalledWith(screenCaptureRequest());
    const video = lastRoom().localParticipant.lastCapture[0] as FakeLocalScreenTrack;
    expect(video.mediaStreamTrack.contentHint).toBe("detail");
    expect(video.setPublishingQuality).toHaveBeenLastCalledWith(capOf("480p"));
  });

  it("tells the sharer when their browser gave no sound", async () => {
    installFakeApi({ me: member });
    const user = await readyRoom();
    lastRoom().localParticipant.nextPickerAudio = false;

    await pickScreen(user);

    expect(await screen.findByText(/no sound is being shared/i)).toBeInTheDocument();
  });

  it("says nothing about sound when it is being shared", async () => {
    installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);

    expect(screen.queryByText(/no sound is being shared/i)).not.toBeInTheDocument();
  });
});

describe("room: changing the stream while sharing", () => {
  afterEach(() => localStorage.clear());

  it("changes the quality live from my player: same stream, and the API tells everyone", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);
    const local = lastRoom().localParticipant;
    const video = local.screens[0].track;

    await pickInMenu(user, "480p");

    await waitFor(() => {
      expect(myLiveStream(server)?.settings).toEqual({ quality: "480p", mode: "smooth" });
      expect(video.setPublishingQuality).toHaveBeenLastCalledWith(capOf("480p"));
    });
    // No new track and no reload for viewers.
    expect(local.publishTrack).toHaveBeenCalledTimes(2);
    expect(local.unpublishTrack).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "You" })).toBeInTheDocument();
    expect(localStorage.getItem("xove.share.quality")).toBe("480p");
  });

  it("can raise the quality again while sharing", async () => {
    localStorage.setItem("xove.share.quality", "480p");
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);
    const video = lastRoom().localParticipant.screens[0].track;

    await pickInMenu(user, "1080p");

    await waitFor(() => {
      expect(myLiveStream(server)?.settings.quality).toBe("1080p");
      expect(video.setPublishingQuality).toHaveBeenLastCalledWith(capOf("1080p"));
    });
  });

  it("changes the mode live: marked for detail, keeping sharpness", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);
    const video = lastRoom().localParticipant.screens[0].track;

    await pickInMenu(user, "Sharp");

    await waitFor(() => expect(myLiveStream(server)?.settings).toEqual({ quality: "1080p", mode: "sharp" }));
    expect(video.mediaStreamTrack.contentHint).toBe("detail");
    expect(video.setDegradationPreference).toHaveBeenLastCalledWith("maintain-resolution");
  });

  it("puts the old settings back when the API refuses the change", async () => {
    const server = installFakeApi({ me: member });
    server.failures.set("POST /api/streams/screen/settings", {
      status: 409,
      body: { status: 409, detail: "Only the person sharing can change how their stream is sent." },
    });
    const user = await readyRoom();
    await startSharing(user);
    const video = lastRoom().localParticipant.screens[0].track;

    await pickInMenu(user, "480p");

    expect(await screen.findByRole("alert")).toHaveTextContent(/only the person sharing/i);
    await waitFor(() => {
      expect(tickedQuality()).toBe("1080p");
      expect(video.setPublishingQuality).toHaveBeenLastCalledWith(capOf("1080p"));
    });
    expect(localStorage.getItem("xove.share.quality")).not.toBe("480p");
  });

  it("stops everything when Stop is pressed after a change", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);
    const local = lastRoom().localParticipant;
    await pickInMenu(user, "720p");
    await waitFor(() => expect(myLiveStream(server)?.settings.quality).toBe("720p"));

    await user.click(within(controls()).getByRole("button", { name: /stop sharing/i }));

    expect(await screen.findByLabelText("0 of 6 live, 6 seats open")).toBeInTheDocument();
    expect(local.screens).toHaveLength(0);
    expect(local.screenAudio).toBeNull();
    expect(local.lastCapture.every((t) => t.stopped)).toBe(true);
    expect(myLiveStream(server)).toBeUndefined();
  });
});

describe("room: the sharer sees what they send", () => {
  it("plays my own screen on the stage, without its sound", async () => {
    installFakeApi({ me: member });
    const user = await readyRoom();

    await startSharing(user);

    const video = await screen.findByLabelText("Your shared screen");
    const local = lastRoom().localParticipant;
    expect(local.screens[0].track.attached).toContain(video);
    // No browser picture-in-picture button over the player (Edge adds one).
    expect(video).toHaveAttribute("disablepictureinpicture");
    expect(video).toHaveProperty("muted", true);
    // My own sound would echo: it isn't played back to me.
    expect(local.screenAudio?.track.attached ?? []).toHaveLength(0);
  });
});

describe("room: the viewer's quality and volume", () => {
  afterEach(() => localStorage.clear());

  const watchBruno = async (options: { height?: number; withSound?: boolean; layers?: number } = {}) => {
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Bruno Lima", 7)];
    const view = renderRoom();
    await connected();
    await screen.findByRole("heading", { name: "Bruno" });
    act(() => {
      lastRoom().publishScreen("user-7", options);
    });
    await screen.findByLabelText("Bruno's shared screen");
    return view;
  };

  // Spec 0107, AC-4: no quality to pick while watching.
  it("always asks for Auto, whatever quality was remembered before", async () => {
    localStorage.setItem("xove.watch.quality", "480p");
    await watchBruno();
    const publication = lastRoom().screenPublication("user-7")!;

    expect(publication.setVideoQuality).toHaveBeenLastCalledWith(2);
    expect(publication.setVideoDimensions).not.toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.queryByRole("radiogroup", { name: /watch/i })).not.toBeInTheDocument();
  });

  it("a tap mutes the screen's sound; resting on it opens its own slider; the volume is remembered (spec 0123)", async () => {
    const view = await watchBruno({ withSound: true });
    const user = userEvent.setup();
    const sound = lastRoom().remoteParticipants.get("user-7")!.tracks.get("screen_share_audio")!;
    const audio = () => sound.attached[0] as HTMLAudioElement;

    await user.click(within(stage()).getByRole("button", { name: "Mute the screen's sound" }));
    expect(audio().muted).toBe(true);
    const button = within(stage()).getByRole("button", { name: "Unmute the screen's sound" });
    expect(button).toHaveAttribute("aria-pressed", "true");

    // Resting the mouse on it opens its own slider; moving it unmutes.
    await user.hover(button);
    const bar = () => screen.getByRole("slider", { name: "Screen sound volume" });
    await waitFor(() => expect(bar().closest("[inert]")).toBeNull());
    fireEvent.change(bar(), { target: { value: "0.3" } });
    expect(audio().volume).toBeCloseTo(0.3);
    expect(audio().muted).toBe(false);

    view.unmount();
    await watchBruno({ withSound: true });
    expect(screen.getByRole("slider", { name: "Screen sound volume" })).toHaveValue("0.3");
  });

  it("greys the screen's sound in its place while there's none, and brings it back (spec 0123)", async () => {
    await watchBruno({ withSound: true });
    act(() => {
      lastRoom().unpublish("user-7", "screen_share_audio");
    });
    const greyed = await within(stage()).findByRole("button", { name: "No sound in this stream" });
    expect(greyed).toHaveAttribute("aria-disabled", "true");
    act(() => {
      lastRoom().publishSound("user-7");
    });
    expect(await within(stage()).findByRole("button", { name: "Mute the screen's sound" })).toBeInTheDocument();
  });

  it("plays the voice of the person I watch, at its own mute, and lights it while they speak (spec 0123)", async () => {
    await watchBruno({ withSound: true });
    const user = userEvent.setup();
    expect(within(stage()).getByRole("button", { name: "Bruno's mic is off" })).toHaveAttribute("aria-disabled", "true");

    let voice!: ReturnType<ReturnType<typeof lastRoom>["publishVoice"]>;
    act(() => {
      voice = lastRoom().publishVoice("user-7");
    });
    const button = await within(stage()).findByRole("button", { name: "Mute Bruno's voice" });
    await waitFor(() => expect(voice.attached).toHaveLength(1));
    expect(button).not.toHaveAttribute("data-talking");
    act(() => {
      lastRoom().setSpeaking("user-7", true);
    });
    await waitFor(() => expect(button).toHaveAttribute("data-talking"));

    await user.click(button);
    expect((voice.attached[0] as HTMLAudioElement).muted).toBe(true);
    expect(within(stage()).getByRole("button", { name: "Unmute Bruno's voice" })).not.toHaveAttribute("data-talking");
  });

  it("closes the settings when another stream takes the stage (spec 0123)", async () => {
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Bruno Lima", 7), someoneSharing("Ana Souza", 3)];
    renderRoom();
    await connected();
    await screen.findByRole("heading", { name: "Bruno" });
    const user = userEvent.setup();
    await user.click(within(stage()).getByRole("button", { name: "Go live" }));
    await user.click(within(stage()).getByRole("menuitem", { name: "Settings" }));
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Watch Ana's screen/ }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Settings" })).not.toBeInTheDocument());
  });

  it("gives the sharer's own player nothing to hear; the cog opens the settings for what I send", async () => {
    installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);

    expect(within(stage()).queryByRole("button", { name: /screen's sound|No sound/ })).not.toBeInTheDocument();
    expect(within(stage()).getByRole("button", { name: "Settings" })).toBeInTheDocument();
    expect(within(stage()).queryByLabelText("Send quality")).not.toBeInTheDocument();
    expect(within(stage()).queryByLabelText("Mode")).not.toBeInTheDocument();
    expect(within(stage()).queryByRole("combobox")).not.toBeInTheDocument();
  });
});

describe("room: viewers follow the sharer's changes", () => {
  afterEach(() => localStorage.clear());

  it("asks for Auto, at most the sharer's quality", async () => {
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Bruno Lima", 7)];
    renderRoom();
    await connected();
    await screen.findByRole("heading", { name: "Bruno" });
    act(() => {
      lastRoom().publishScreen("user-7");
    });
    await screen.findByLabelText("Bruno's shared screen");
    const publication = lastRoom().screenPublication("user-7")!;

    // Bruno lowers his quality; the API says so on the next poll.
    act(() => {
      server.streams[0].settings = { quality: "720p", mode: "smooth" };
    });

    await waitFor(() => {
      expect(publication.setVideoDimensions).toHaveBeenLastCalledWith({ width: 1280, height: 720 });
    });

    // And raises it back.
    act(() => {
      server.streams[0].settings = { quality: "1080p", mode: "smooth" };
    });

    await waitFor(() => {
      expect(publication.setVideoQuality).toHaveBeenLastCalledWith(2);
    });
  });

});

describe("room: the player's labels and bars", () => {
  it("show while the mouse moves over the player, and fade when it stops or leaves", async () => {
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Bruno Lima", 7)];
    renderRoom();
    await connected();
    await screen.findByRole("heading", { name: "Bruno" });
    act(() => {
      lastRoom().publishScreen("user-7");
    });
    const video = await screen.findByLabelText("Bruno's shared screen");
    const frame = video.closest("[data-chrome]")!;
    expect(frame).toHaveAttribute("data-chrome", "hidden");

    fireEvent.pointerMove(frame);
    expect(frame).toHaveAttribute("data-chrome", "shown");

    fireEvent.pointerLeave(frame);
    expect(frame).toHaveAttribute("data-chrome", "hidden");

    fireEvent.pointerMove(frame);
    await waitFor(() => expect(frame).toHaveAttribute("data-chrome", "hidden"), { timeout: 4000 });
  });
});

describe("room: the controls don't vanish under a still mouse", () => {
  async function playing() {
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Bruno Lima", 7)];
    renderRoom();
    await connected();
    act(() => {
      lastRoom().publishScreen("user-7");
    });
    const frame = (await screen.findByLabelText("Bruno's shared screen")).closest("[data-chrome]") as HTMLElement;
    fireEvent.pointerMove(frame);
    expect(frame).toHaveAttribute("data-chrome", "shown");
    return frame;
  }
  afterEach(() => {
    delete (document as { fullscreenElement?: unknown }).fullscreenElement;
    vi.restoreAllMocks();
  });

  it("ignores a 'mouse left' while the player is fullscreen: there's nothing outside it", async () => {
    const frame = await playing();
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => frame });
    fireEvent.pointerLeave(frame, { pointerType: "mouse", clientX: 0, clientY: 0 });
    expect(frame).toHaveAttribute("data-chrome", "shown");
  });

  it("ignores a 'mouse left' that comes while the pointer is still over the player", async () => {
    const frame = await playing();
    vi.spyOn(frame, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, right: 800, bottom: 450, width: 800, height: 450 } as DOMRect);
    fireEvent.pointerLeave(frame, { pointerType: "mouse", clientX: 400, clientY: 200 });
    expect(frame).toHaveAttribute("data-chrome", "shown");
    // Really outside: hidden at once, as before.
    fireEvent.pointerLeave(frame, { pointerType: "mouse", clientX: 900, clientY: 200 });
    expect(frame).toHaveAttribute("data-chrome", "hidden");
  });
});

describe("room: my screen and camera buttons on the player (spec 0098)", () => {
  it("has no bar under the player: the buttons are on the stage, and never fade over an empty one", async () => {
    installFakeApi({ me: member });
    await readyRoom();

    expect(screen.queryByRole("region", { name: /screen sharing/i })).not.toBeInTheDocument();
    const share = within(stage()).getByRole("button", { name: "Share your screen" });
    expect(within(stage()).getByRole("button", { name: "Turn on your camera" })).toBeInTheDocument();
    expect(share.closest("[data-chrome]")).toBeNull();
    expect(screen.queryByRole("button", { name: /share my screen/i })).not.toBeInTheDocument();
  });

  it("puts each control by its owner in the four states (spec 0123, AC-1)", async () => {
    const server = installFakeApi({ me: member });
    renderRoom();
    await connected();
    const row = () =>
      within(stage())
        .getAllByRole("button")
        .filter((b) => !b.closest("[inert]"))
        .map((b) => b.getAttribute("aria-label") ?? b.textContent?.trim())
        .filter((name) => name !== "Fullscreen" && name !== "Exit fullscreen" && !name?.startsWith("Watch "));
    // Nobody live: the two ways to start on the stage, the settings in the corner.
    expect(row()).toEqual(["Share your screen", "Turn on your camera", "Settings"]);

    // Watching someone, not live: what I hear at the left, Go live at the right, nothing of mine in the middle.
    act(() => {
      server.streams = [someoneSharing("Bruno Lima", 7)];
    });
    await screen.findByRole("heading", { name: "Bruno" });
    act(() => {
      lastRoom().publishScreen("user-7", { withSound: true });
    });
    await screen.findByLabelText("Bruno's shared screen");
    expect(row()).toEqual(["Mute the screen's sound", "Bruno's mic is off", "Go live"]);

    // Going live opens my own stream: my controls in the middle, my mic with them, nothing to hear.
    const user = userEvent.setup();
    await user.click(within(stage()).getByRole("button", { name: "Go live" }));
    await user.click(within(stage()).getByRole("menuitem", { name: /share your screen/i }));
    await screen.findByLabelText("Your shared screen");
    expect(row().slice(0, 4)).toEqual(["Stop sharing your screen", "Turn on your camera", "Share your voice", "Settings"]);
    expect(row()).not.toContain("Mute the screen's sound");

    // Watching someone while live: what I hear at the left, my mic at the right.
    await user.click(screen.getByRole("button", { name: /Watch Bruno's screen/ }));
    await screen.findByLabelText("Bruno's shared screen");
    expect(row()).toEqual(["Mute the screen's sound", "Bruno's mic is off", "Share your voice"]);
  });

  it("fade with the player's bars over a stream", async () => {
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Bruno Lima", 7)];
    renderRoom();
    await connected();
    act(() => {
      lastRoom().publishScreen("user-7");
    });
    const frame = (await screen.findByLabelText("Bruno's shared screen")).closest("[data-chrome]")!;

    expect(frame).toContainElement(within(stage()).getByRole("button", { name: "Go live" }));
    expect(frame).toHaveAttribute("data-chrome", "hidden");
    fireEvent.pointerMove(frame);
    expect(frame).toHaveAttribute("data-chrome", "shown");
  });

  it("stay while the settings are open", async () => {
    installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);
    const frame = (await screen.findByLabelText("Your shared screen")).closest("[data-chrome]")!;

    await user.click(within(stage()).getByRole("button", { name: "Settings" }));
    (document.activeElement as HTMLElement).blur();
    fireEvent.pointerLeave(frame);

    expect(frame).toHaveAttribute("data-chrome", "shown");
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();

    // Past the time the bars would fade: still shown while the settings are open.
    fireEvent.pointerMove(frame);
    (document.activeElement as HTMLElement).blur();
    await new Promise((resolve) => setTimeout(resolve, 2700));
    expect(frame).toHaveAttribute("data-chrome", "shown");
  });
});

describe("room: fullscreen (spec 0098)", () => {
  it("enters fullscreen, and leaves it with the same button", async () => {
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Bruno Lima", 7)];
    renderRoom();
    await connected();
    act(() => {
      lastRoom().publishScreen("user-7");
    });
    const frame = (await screen.findByLabelText("Bruno's shared screen")).closest("[data-chrome]") as HTMLElement;
    // jsdom has no fullscreen: play the browser's part.
    let current: Element | null = null;
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => current });
    const enter = vi.fn(async () => {
      current = frame;
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    const exit = vi.fn(async () => {
      current = null;
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    frame.requestFullscreen = enter;
    document.exitFullscreen = exit;
    const user = userEvent.setup();

    try {
      await user.click(within(stage()).getByRole("button", { name: "Fullscreen" }));
      expect(enter).toHaveBeenCalled();

      await user.click(await within(stage()).findByRole("button", { name: "Exit fullscreen" }));
      expect(exit).toHaveBeenCalled();
      expect(enter).toHaveBeenCalledTimes(1);
      expect(await within(stage()).findByRole("button", { name: "Fullscreen" })).toBeInTheDocument();
    } finally {
      delete (document as { fullscreenElement?: unknown }).fullscreenElement;
    }
  });
});

describe("room: fullscreen from the empty stage (spec 0111)", () => {
  it("has the fullscreen button with nobody live", async () => {
    installFakeApi({ me: member });
    renderRoom();
    await connected();
    expect(await within(stage()).findByRole("button", { name: "Fullscreen" })).toBeInTheDocument();
  });

  it("keeps it when the only stream stops in fullscreen, and it leaves fullscreen", async () => {
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Bruno Lima", 7)];
    renderRoom();
    await connected();
    act(() => {
      lastRoom().publishScreen("user-7");
    });
    const frame = (await screen.findByLabelText("Bruno's shared screen")).closest("[data-chrome]") as HTMLElement;
    let current: Element | null = null;
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => current });
    frame.requestFullscreen = vi.fn(async () => {
      current = frame;
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    const exit = vi.fn(async () => {
      current = null;
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    document.exitFullscreen = exit;
    const user = userEvent.setup();
    try {
      await user.click(within(stage()).getByRole("button", { name: "Fullscreen" }));
      act(() => {
        server.streams = [];
        lastRoom().unpublish("user-7", "screen_share");
      });
      expect(await screen.findByLabelText("0 of 6 live, 6 seats open")).toBeInTheDocument();
      await user.click(await within(stage()).findByRole("button", { name: "Exit fullscreen" }));
      expect(exit).toHaveBeenCalled();
    } finally {
      delete (document as { fullscreenElement?: unknown }).fullscreenElement;
    }
  });
});

describe("room: the player's fullscreen while the whole page is fullscreen (spec 0160)", () => {
  it("puts the player fullscreen instead of leaving the page's", async () => {
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Bruno Lima", 7)];
    renderRoom();
    await connected();
    act(() => {
      lastRoom().publishScreen("user-7");
    });
    const frame = (await screen.findByLabelText("Bruno's shared screen")).closest("[data-chrome]") as HTMLElement;
    let current: Element | null = document.documentElement;
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => current });
    const enter = vi.fn(async () => {
      current = frame;
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    const exit = vi.fn(async () => {});
    frame.requestFullscreen = enter;
    document.exitFullscreen = exit;
    try {
      await userEvent.setup().click(within(stage()).getByRole("button", { name: "Fullscreen" }));
      expect(enter).toHaveBeenCalled();
      expect(exit).not.toHaveBeenCalled();
    } finally {
      delete (document as { fullscreenElement?: unknown }).fullscreenElement;
    }
  });
});

describe("room: starting from fullscreen (spec 0101)", () => {
  /** Plays the browser putting the stage's player in fullscreen (jsdom has none). */
  function enterFullscreen() {
    const frame = stage().querySelector("[class*='frame']") as HTMLElement;
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => frame });
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    return frame;
  }
  afterEach(() => {
    delete (document as { fullscreenElement?: unknown }).fullscreenElement;
  });

  it("starts from the fullscreen player, and keeps it fullscreen", async () => {
    installFakeApi({ me: member });
    const user = await readyRoom();
    const frame = enterFullscreen();

    await user.click(within(controls()).getByRole("button", { name: /share your screen/i }));
    expect(document.fullscreenElement).toBe(frame);
    expect(await screen.findByRole("heading", { name: "You" })).toBeInTheDocument();
  });

  it("shows a failed start over the fullscreen player too", async () => {
    installFakeApi({ me: member });
    const user = await readyRoom();
    const frame = enterFullscreen();
    lastRoom().localParticipant.nextPicker = "no-video";

    await user.click(within(controls()).getByRole("button", { name: /share your screen/i }));

    expect(frame).toContainElement(await screen.findByRole("alert"));
  });
});

describe("room: change window and pick a camera (spec 0098)", () => {
  afterEach(() => localStorage.clear());

  it("with the settings open, resting on the live screen button goes to Screen and cues Change (spec 0115)", async () => {
    installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);
    const real = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation((q: string) =>
      q.includes("hover: hover") ? ({ ...real(q), matches: true, media: q } as MediaQueryList) : real(q),
    );
    await openMenu(user, "Camera");
    const panel = within(screen.getByRole("dialog", { name: "Settings" }));
    const stop = within(stage()).getByRole("button", { name: "Stop sharing your screen" });
    fireEvent.pointerEnter(stop.closest("[data-dropup]")!, { pointerType: "mouse" });
    await waitFor(() => expect(panel.getByRole("tab", { name: (n) => n.startsWith("Screen") })).toHaveAttribute("aria-selected", "true"));
    expect(panel.getByRole("button", { name: "Change" }).querySelector("[data-cue]")).not.toBeNull();
    expect(stop.closest("[data-dropup]")).toHaveAttribute("data-open", "false");
    vi.restoreAllMocks();
  });

  it("swaps what my screen shares from the settings, on the same stream", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    const local = lastRoom().localParticipant;
    local.nextPickerAudio = false;
    await startSharing(user);
    const started = myLiveStream(server);
    const video = local.screens[0].track;
    expect(within(stage()).getByRole("button", { name: "Stop sharing your screen" })).toHaveAccessibleDescription(
      expect.stringMatching(/no sound is being shared/i),
    );

    local.nextPickerAudio = true;
    await user.click((await openMenu(user)).getByRole("button", { name: "Change" }));

    await waitFor(() => {
      expect(video.replaceTrack).toHaveBeenCalled();
      expect(local.getDisplayMedia).toHaveBeenCalledTimes(2);
    });
    // No setup window, no new stream: the API's stream is the same one.
    expect(screen.getAllByRole("dialog").map((d) => d.getAttribute("aria-label"))).toEqual(["Settings"]);
    expect(myLiveStream(server)).toEqual(started);
    expect(server.calls.filter((c) => c.path === "/api/streams" && c.method === "POST")).toHaveLength(1);
    expect(local.screens).toHaveLength(1);
    // The new pick has sound: it's sent, and the badge goes.
    await waitFor(() =>
      expect(within(stage()).getByRole("button", { name: "Stop sharing your screen" })).not.toHaveAccessibleDescription(),
    );
    expect(local.screenAudio?.track.source).toBe("screen_share_audio");
  });

  it("keeps my share when the picker is closed", async () => {
    installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);
    const local = lastRoom().localParticipant;
    local.nextPicker = "cancel";

    await user.click((await openMenu(user)).getByRole("button", { name: "Change" }));

    expect(local.screens[0].track.replaceTrack).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "You" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("switches my camera from the settings without stopping it", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    await user.click(within(controls()).getByRole("button", { name: /turn on your camera/i }));
    await waitFor(() => expect(myLiveStream(server, "camera")).toBeDefined());
    const camera = lastRoom().localParticipant.lastCamera!;

    const menu = await openMenu(user, "Camera");
    await user.click(await menu.findByRole("button", { name: "Camera: Logitech C920" }));
    await user.click(menu.getByRole("radio", { name: "Integrated Webcam" }));

    await waitFor(() => expect(camera.restartTrack).toHaveBeenCalled());
    expect(lastRoom().localParticipant.camera?.track).toBe(camera);
    expect(myLiveStream(server, "camera")).toBeDefined();
    expect(await menu.findByRole("button", { name: "Camera: Integrated Webcam" })).toBeInTheDocument();
  });
});

describe("room: the player on touch screens and keyboards", () => {
  const watchBruno = async () => {
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Bruno Lima", 7)];
    const view = renderRoom();
    await connected();
    await screen.findByRole("heading", { name: "Bruno" });
    act(() => {
      lastRoom().publishScreen("user-7");
    });
    const video = await screen.findByLabelText("Bruno's shared screen");
    return { view, frame: video.closest("[data-chrome]")! };
  };

  it("shows the controls on a tap and hides them on the next; a tap on a button only presses it (spec 0131, AC-7)", async () => {
    const { frame } = await watchBruno();
    const tap = (on: Element) => {
      fireEvent.pointerDown(on, { pointerType: "touch", clientX: 200, clientY: 120 });
      // A finger lifting off fires pointerleave right away: it hides nothing.
      fireEvent.pointerLeave(frame, { pointerType: "touch" });
      fireEvent.pointerUp(on, { pointerType: "touch", clientX: 200, clientY: 120 });
    };

    tap(frame);
    expect(frame).toHaveAttribute("data-chrome", "shown");
    tap(within(stage()).getByRole("button", { name: "Fullscreen" }));
    expect(frame).toHaveAttribute("data-chrome", "shown");
    tap(frame);
    expect(frame).toHaveAttribute("data-chrome", "hidden");
  });

  it("toggles the controls with a tap on the box beside the picture, the dark sides included (spec 0133, AC-3)", async () => {
    const { frame } = await watchBruno();
    // The box itself, around the picture's view: what a tap next to a tall picture lands on (the
    // real tap on the dark side is the validation's AC-3, in a browser).
    const view = frame.querySelector("video")!.closest("[class*=view]")!;
    expect(frame).not.toBe(view);
    expect(frame.contains(view)).toBe(true);
    const tapBox = () => {
      fireEvent.pointerDown(frame, { pointerType: "touch", clientX: 5, clientY: 5 });
      fireEvent.pointerUp(frame, { pointerType: "touch", clientX: 5, clientY: 5 });
    };
    tapBox();
    expect(frame).toHaveAttribute("data-chrome", "shown");
    tapBox();
    expect(frame).toHaveAttribute("data-chrome", "hidden");
  });

  it("keeps the controls while one of them has the keyboard focus", async () => {
    const { frame } = await watchBruno();

    act(() => {
      within(stage()).getByRole("button", { name: "Fullscreen" }).focus();
    });
    expect(frame).toHaveAttribute("data-chrome", "shown");

    await new Promise((resolve) => setTimeout(resolve, 2700));
    expect(frame).toHaveAttribute("data-chrome", "shown");
  });

  it("doesn't hide anything over an empty stage", async () => {
    installFakeApi({ me: member });
    renderRoom();
    await screen.findByLabelText("0 of 6 live, 6 seats open");

    expect(stage().querySelector("[data-chrome]")).toBeNull();
  });
});

describe("room: quick changes while sharing", () => {
  afterEach(() => localStorage.clear());

  it("applies changes in order, and the last one wins everywhere", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);
    const video = lastRoom().localParticipant.screens[0].track;
    const menu = await openMenu(user);

    fireEvent.click(menu.getByRole("radio", { name: "720p" }));
    fireEvent.click(menu.getByRole("radio", { name: "480p" }));

    await waitFor(() => expect(myLiveStream(server)?.settings.quality).toBe("480p"));
    const sent = server.calls.filter((c) => c.path === "/api/streams/screen/settings").map((c) => (c.body as { quality: string }).quality);
    expect(sent).toEqual(["720p", "480p"]);
    expect(video.setPublishingQuality).toHaveBeenLastCalledWith(capOf("480p"));
    expect(tickedQuality()).toBe("480p");
  });
});

// ---- a full room: the queue and the seat offer (spec 0060) ----

describe("room: waiting for a seat", () => {
  const offered = (seconds: number) =>
    ({ status: "offered", until: new Date(Date.now() + seconds * 1000).toISOString(), seconds }) as const;

  it("waits with its place in the queue when the room is full, without joining the video", async () => {
    const server = installFakeApi({ me: member });
    server.seat = { status: "waiting", place: 3 };
    renderRoom();

    expect(await screen.findByText(/you're number 3 in line/i)).toBeInTheDocument();
    expect(server.calls.some((c) => c.path === "/api/livekit/token")).toBe(false);

    act(() => {
      server.seat = { status: "waiting", place: 1 };
    });
    expect(await screen.findByText(/you're next/i)).toBeInTheDocument();
  });

  it("offers the seat in a popup with a countdown, and Enter room takes it", async () => {
    const server = installFakeApi({ me: member });
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

    await userEvent.setup().click(within(offer).getByRole("button", { name: /enter room/i }));

    await connected();
    expect(server.calls.some((c) => c.method === "POST" && c.path === "/api/room/accept")).toBe(true);
    expect(document.title).not.toBe("Your turn — Xovê");
  });

  it("leaves the queue on Cancel, and can join it again", async () => {
    const server = installFakeApi({ me: member });
    server.seat = offered(60);
    renderRoom();
    const offer = await screen.findByRole("dialog", { name: /it's your turn/i });
    const user = userEvent.setup();

    await user.click(within(offer).getByRole("button", { name: /cancel/i }));

    expect(await screen.findByText(/you left the queue/i)).toBeInTheDocument();
    expect(server.calls.some((c) => c.method === "POST" && c.path === "/api/room/cancel")).toBe(true);
    const polls = server.calls.filter((c) => c.path === "/api/room/enter").length;
    await new Promise((resolve) => setTimeout(resolve, FAST_POLL * 3));
    expect(server.calls.filter((c) => c.path === "/api/room/enter")).toHaveLength(polls);

    server.seat = { status: "waiting", place: 4 };
    await user.click(screen.getByRole("button", { name: /join the queue again/i }));
    expect(await screen.findByText(/you're number 4 in line/i)).toBeInTheDocument();
  });

  it("goes back to waiting when the offer runs out", async () => {
    const server = installFakeApi({ me: member });
    server.seat = offered(1);
    renderRoom();
    await screen.findByRole("dialog", { name: /it's your turn/i });

    act(() => {
      server.seat = { status: "waiting", place: 2 };
    });

    expect(await screen.findByText(/you're number 2 in line/i)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("tells the API when the waiting tab closes, so the place is kept for a while", async () => {
    const server = installFakeApi({ me: member });
    server.seat = { status: "waiting", place: 2 };
    renderRoom();
    await screen.findByText(/you're number 2 in line/i);

    const leave = () => server.calls.find((c) => c.method === "POST" && c.path === "/api/room/leave");
    await waitFor(() => {
      act(() => {
        window.dispatchEvent(new Event("pagehide"));
      });
      expect(leave()).toBeDefined();
    });
    expect(leave()?.keepalive).toBe(true);
  });

  it("enters again when the API forgot the seat (after a restart), staying in the room", async () => {
    const server = installFakeApi({ me: member });
    renderRoom();
    await connected();
    const room = lastRoom();
    const enters = () => server.calls.filter((c) => c.path === "/api/room/enter").length;
    const before = enters();

    act(() => {
      server.seated = false;
    });

    await waitFor(() => expect(enters()).toBeGreaterThan(before));
    await waitFor(() => expect(server.seated).toBe(true));
    // My video connection goes with it: that confirms the seat.
    expect(server.calls.filter((c) => c.path === "/api/room/enter").at(-1)?.body).toEqual({ participantSid: "PA_me" });
    expect(room.disconnected).toBe(false);
    expect(screen.getByRole("button", { name: /: account, connected$/ })).toBeInTheDocument();
  });

  it("goes to the queue when the API forgot the seat and the room filled up", async () => {
    const server = installFakeApi({ me: member });
    renderRoom();
    await connected();
    const room = lastRoom();

    act(() => {
      server.seated = false;
      server.seat = { status: "waiting", place: 1 };
    });

    expect(await screen.findByText(/you're next/i)).toBeInTheDocument();
    // The video room is left when the room's view goes, which can be a render after the waiting screen shows.
    await waitFor(() => expect(room.disconnected).toBe(true));
  });
});

// ---- cameras (spec 0060) ----

describe("room: my camera", () => {
  afterEach(() => localStorage.clear());

  /** Clicks "Turn on your camera": it's sent at once (spec 0107). */
  async function turnOnCamera(user: User) {
    await user.click(within(controls()).getByRole("button", { name: /turn on your camera/i }));
    await waitFor(() => expect(within(controls()).getByRole("button", { name: /turn off your camera/i })).toBeInTheDocument());
  }

  // AC-3
  it("asks for the camera only after the click, never for a microphone, and sends it at once", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    const local = lastRoom().localParticipant;
    expect(local.createTracks).not.toHaveBeenCalled();

    await turnOnCamera(user);

    expect(local.createTracks).toHaveBeenCalledTimes(1);
    expect(local.createTracks).toHaveBeenCalledWith({ video: cameraCaptureOptions(), audio: false });
    expect(local.getDisplayMedia).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(myLiveStream(server, "camera")).toBeDefined());
  });

  it("starts at 720p the first time, and with the settings remembered after that", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    await turnOnCamera(user);
    await waitFor(() => expect(myLiveStream(server, "camera")).toBeDefined());
    const local = lastRoom().localParticipant;
    const camera = local.lastCamera!;
    expect(local.publishTrack).toHaveBeenCalledWith(camera, { ...cameraPublishOptions("smooth"), source: "camera" });
    expect(camera.setPublishingQuality).toHaveBeenLastCalledWith(capOf("720p"));
    const start = server.calls.find((c) => c.method === "POST" && c.path === "/api/streams");
    expect(start?.body).toEqual({ kind: "camera", participantSid: "PA_me", trackSid: "TR_my_camera", quality: "720p", mode: "smooth" });
  });

  // Spec 0107: the Camera tab's preview.
  it("turns the camera on for the settings' preview only, and off when they close", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    const local = lastRoom().localParticipant;

    await openMenu(user, "Camera");
    await waitFor(() => expect(local.createTracks).toHaveBeenCalledTimes(1));
    const preview = local.lastCamera!;
    expect(preview.attached.length).toBeGreaterThan(0);
    expect(local.publishTrack).not.toHaveBeenCalled();
    expect(server.streams).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Close settings" }));
    await waitFor(() => expect(preview.stopped).toBe(true));
    expect(local.publishTrack).not.toHaveBeenCalled();
  });

  it("asks for the camera when the tab opens, and says how to allow it when it's refused", async () => {
    installFakeApi({ me: member });
    const user = await readyRoom();
    lastRoom().localParticipant.nextCamera = "NotAllowedError";

    const tab = await openMenu(user, "Camera");

    expect(await tab.findByRole("status")).toHaveTextContent(/allow it for Xovê in your browser's or phone's settings/i);
    expect(lastRoom().localParticipant.publishTrack).not.toHaveBeenCalled();
  });

  it("sends the preview's camera as is when the camera button is pressed: no second ask", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    const local = lastRoom().localParticipant;
    await openMenu(user, "Camera");
    await waitFor(() => expect(local.createTracks).toHaveBeenCalledTimes(1));
    const preview = local.lastCamera!;

    await turnOnCamera(user);

    await waitFor(() => expect(myLiveStream(server, "camera")).toBeDefined());
    expect(local.createTracks).toHaveBeenCalledTimes(1);
    expect(local.publishTrack).toHaveBeenCalledWith(preview, expect.anything());
    expect(preview.stopped).toBe(false);
    expect(within(screen.getByRole("dialog", { name: "Settings" })).getByText("LIVE")).toBeInTheDocument();
  });

  it("starts with the camera settings remembered from last time", async () => {
    localStorage.setItem("xove.camera.quality", "480p");
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    await turnOnCamera(user);
    await waitFor(() => expect(myLiveStream(server, "camera")).toBeDefined());
    expect(lastRoom().localParticipant.lastCamera!.setPublishingQuality).toHaveBeenLastCalledWith(capOf("480p"));
    const start = server.calls.find((c) => c.method === "POST" && c.path === "/api/streams");
    expect(start?.body).toMatchObject({ kind: "camera", quality: "480p" });
  });

  // AC-2
  it("shares the screen and the camera together, as 2 of the 6 places", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();

    await startSharing(user);
    await turnOnCamera(user);

    expect(server.streams.map((st) => st.kind)).toEqual(["screen", "camera"]);
    expect(6 - server.streams.length).toBe(4);
    expect(lastRoom().localParticipant.isScreenShareEnabled).toBe(true);
  });

  it("turns the camera off: stops sending it and ends its stream, the screen stays", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);
    await turnOnCamera(user);
    const local = lastRoom().localParticipant;
    const camera = local.lastCamera!;

    await user.click(within(controls()).getByRole("button", { name: /turn off your camera/i }));

    await waitFor(() => {
      expect(myLiveStream(server, "camera")).toBeUndefined();
      expect(local.unpublishTrack).toHaveBeenCalledWith(camera, true);
    });
    expect(camera.stopped).toBe(true);
    expect(myLiveStream(server, "screen")).toBeDefined();
  });

  it("says so when the browser blocks the camera, and sends nothing", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    lastRoom().localParticipant.nextCamera = "NotAllowedError";

    await user.click(within(controls()).getByRole("button", { name: /turn on your camera/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/didn't allow the camera/i);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(server.streams).toHaveLength(0);
  });

  it("says so when there's no camera", async () => {
    installFakeApi({ me: member });
    const user = await readyRoom();
    lastRoom().localParticipant.nextCamera = "NotFoundError";

    await user.click(within(controls()).getByRole("button", { name: /turn on your camera/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No camera found.");
  });

  it("shows someone's camera on the stage when that's all they share", async () => {
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Bruno Lima", 7, "camera")];
    renderRoom();
    await connected();

    act(() => {
      lastRoom().publishCamera("user-7");
    });

    expect(await screen.findByLabelText("Bruno's camera")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bruno" })).toBeInTheDocument();
    expect(screen.getByText("Camera")).toBeInTheDocument();
  });
});

// ---- who is big, and the thumbnails (spec 0060, AC-5) ----

describe("room: several people sharing", () => {
  const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);
  const thumbnails = () => screen.getByRole("list", { name: /other streams/i });

  async function threeSharing() {
    const server = installFakeApi({ me: member });
    server.streams = [
      someoneSharing("Ana Souza", 3, "screen", undefined, minutesAgo(10)),
      someoneSharing("Bruno Lima", 7, "screen", undefined, minutesAgo(5)),
      someoneSharing("Caio Reis", 9, "camera", undefined, minutesAgo(1)),
    ];
    renderRoom();
    await connected();
    act(() => {
      lastRoom().publishScreen("user-3");
      lastRoom().publishScreen("user-7");
      lastRoom().publishCamera("user-9");
    });
    await screen.findByLabelText("Ana's shared screen");
    return server;
  }

  it("shows the first sharer big, and the others as thumbnails", async () => {
    await threeSharing();

    expect(screen.getByRole("heading", { name: "Ana" })).toBeInTheDocument();
    const items = within(thumbnails()).getAllByRole("button", { name: /watch/i });
    expect(items.map((b) => b.getAttribute("aria-label"))).toEqual(["Watch Bruno's screen", "Watch Caio's camera"]);
    expect(within(thumbnails()).getByLabelText("Bruno's shared screen")).toBeInTheDocument();
    expect(within(thumbnails()).getByLabelText("Caio's camera")).toBeInTheDocument();
  });

  it("makes a thumbnail big on click, and the big one goes back to the thumbnails", async () => {
    await threeSharing();
    const user = userEvent.setup();

    await user.click(within(thumbnails()).getByRole("button", { name: /^Watch Bruno/ }));

    expect(screen.getByRole("heading", { name: "Bruno" })).toBeInTheDocument();
    expect(within(stage()).getByLabelText("Bruno's shared screen")).toBeInTheDocument();
    const names = within(thumbnails()).getAllByRole("button", { name: /watch/i }).map((b) => b.getAttribute("aria-label"));
    expect(names).toEqual(["Watch Ana's screen", "Watch Caio's camera"]);
  });

  it("gives the big place to the longest sharing when the big one stops", async () => {
    const server = await threeSharing();
    const user = userEvent.setup();
    await user.click(within(thumbnails()).getByRole("button", { name: /^Watch Caio/ }));
    expect(screen.getByRole("heading", { name: "Caio" })).toBeInTheDocument();

    act(() => {
      server.streams = server.streams.filter((st) => st.userId !== 9);
    });

    expect(await screen.findByRole("heading", { name: "Ana" })).toBeInTheDocument();
    expect(within(thumbnails()).getAllByRole("button", { name: /watch/i })).toHaveLength(1);
  });

  it("shows no previews with one sharer, just the seats", async () => {
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Ana Souza", 3)];
    renderRoom();
    await screen.findByRole("heading", { name: "Ana" });

    expect(within(screen.getByRole("list", { name: /other streams/i })).queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByLabelText("1 of 6 live, 5 seats open")).toBeInTheDocument();
  });

  it("asks for Auto for the big player, and keeps a stream on Auto when it leaves it (spec 0107)", async () => {
    await threeSharing();
    const ana = lastRoom().screenPublication("user-3")!;
    expect(ana.setVideoQuality).toHaveBeenLastCalledWith(2);

    await userEvent.setup().click(within(thumbnails()).getByRole("button", { name: /^Watch Bruno/ }));

    expect(ana.setVideoQuality).toHaveBeenLastCalledWith(2);
    expect(lastRoom().screenPublication("user-7")!.setVideoQuality).toHaveBeenLastCalledWith(2);
    expect(lastRoom().screenPublication("user-7")!.setVideoDimensions).not.toHaveBeenCalled();
  });
});

// ---- screen and camera together: the facecam (spec 0060, AC-6) ----

describe("room: the facecam", () => {
  async function brunoWithBoth() {
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Bruno Lima", 7, "screen"), someoneSharing("Bruno Lima", 7, "camera")];
    renderRoom();
    await connected();
    act(() => {
      lastRoom().publishScreen("user-7");
      lastRoom().publishCamera("user-7");
    });
    await screen.findByLabelText("Bruno's shared screen");
    return server;
  }

  const facecam = () => stage().querySelector("[data-facecam]") as HTMLElement | null;

  it("shows the screen big and the camera in the facecam on top of it", async () => {
    await brunoWithBoth();

    expect(facecam()).not.toBeNull();
    expect(within(facecam()!).getByLabelText("Bruno's camera")).toBeInTheDocument();
    expect(within(stage()).getAllByLabelText("Bruno's shared screen")).toHaveLength(1);
    expect(facecam()!.contains(within(stage()).getByLabelText("Bruno's shared screen"))).toBe(false);
  });

  it("keeps the facecam on the picture, inside its view, not on the box's dark sides (spec 0133, design decision 4)", async () => {
    await brunoWithBoth();
    const view = within(stage()).getByLabelText("Bruno's shared screen").closest("[class*=view]")!;
    expect(view.contains(facecam())).toBe(true);
  });

  it("starts at the top right, clear of the round buttons and the fullscreen button (spec 0111)", async () => {
    await brunoWithBoth();
    expect(facecam()!.style.left).toBe("73%");
    expect(facecam()!.style.top).toBe("4%");
  });

  it("swaps them with the button, and back", async () => {
    await brunoWithBoth();
    const user = userEvent.setup();

    await user.click(within(facecam()!).getByRole("button", { name: "Swap views" }));

    expect(within(facecam()!).getByLabelText("Bruno's shared screen")).toBeInTheDocument();
    expect(facecam()!.contains(within(stage()).getByLabelText("Bruno's camera"))).toBe(false);

    await user.click(within(facecam()!).getByRole("button", { name: "Swap views" }));
    expect(within(facecam()!).getByLabelText("Bruno's camera")).toBeInTheDocument();
  });

  it("collapses to a tab and expands again", async () => {
    await brunoWithBoth();
    const user = userEvent.setup();

    await user.click(within(facecam()!).getByRole("button", { name: "Hide facecam" }));
    expect(facecam()).toBeNull();
    expect(within(stage()).queryByLabelText("Bruno's camera")).not.toBeInTheDocument();

    await user.click(within(stage()).getByRole("button", { name: "Show facecam" }));
    expect(within(facecam()!).getByLabelText("Bruno's camera")).toBeInTheDocument();
  });

  it("goes away when the camera stops", async () => {
    const server = await brunoWithBoth();

    act(() => {
      server.streams = server.streams.filter((st) => st.kind === "screen");
      lastRoom().unpublish("user-7", "camera");
    });

    await waitFor(() => expect(facecam()).toBeNull());
    expect(within(stage()).getByLabelText("Bruno's shared screen")).toBeInTheDocument();
  });

  it("works on the sharer's own preview too", async () => {
    installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);
    await user.click(within(controls()).getByRole("button", { name: /turn on your camera/i }));

    await waitFor(() => expect(facecam()).not.toBeNull());
    expect(within(facecam()!).getByLabelText("Your camera")).toBeInTheDocument();
    await user.click(within(facecam()!).getByRole("button", { name: "Swap views" }));
    expect(within(facecam()!).getByLabelText("Your shared screen")).toBeInTheDocument();
  });
});

// ---- sound and settings for each stream (spec 0060, AC-7, FR-11) ----

describe("room: theater mode (spec 0104)", () => {
  it("has no sidebar or old header: a logo, the activity pill, people and account up top, and the footer", async () => {
    installFakeApi({ me: member });
    renderRoom();
    await connected();

    const header = screen.getByRole("banner");
    // The drawn mark (spec 0111), not the old typed "xovê.".
    expect(within(header).getByRole("img", { name: "Xovê" })).toBeInTheDocument();
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

  it("with nobody live: the empty stage, no light, and the info row says so", async () => {
    installFakeApi({ me: member });
    renderRoom();
    await connected();

    expect(screen.getByRole("heading", { name: "Nobody is sharing yet" })).toBeInTheDocument();
    expect(screen.getByLabelText("0 of 6 live, 6 seats open")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Go live" })).toBeInTheDocument();
    // No video's ambilight: the empty stage has its own corner glow and its static's light (specs 0123 and 0136).
    expect(document.querySelector("[data-ambilight]")).toBeNull();
  });

  it("puts a stream from the activity list on the stage, a camera event with the camera big", async () => {
    const server = installFakeApi({ me: member });
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
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /^Activity/ }));
    await user.click(screen.getByRole("button", { name: "Bruno turned on their camera: watch" }));

    // Camera big, screen in the facecam.
    await waitFor(() => expect(stage().querySelector("[data-facecam]")).not.toBeNull());
    expect(within(stage().querySelector("[data-facecam]") as HTMLElement).getByLabelText("Bruno's shared screen")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Activity" })).not.toBeInTheDocument());
  });

  it("shows who watches what in the people panel", async () => {
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Bruno Lima", 7)];
    server.watching = [{ userId: 3, sharerId: 7, kind: "screen", mine: false }];
    renderRoom();
    await connected();
    act(() => {
      lastRoom().join("user-3", "Ana Souza");
      lastRoom().join("user-7", "Bruno Lima");
      lastRoom().publishScreen("user-7");
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /people here/ }));

    const panel = screen.getByRole("dialog", { name: "Here now" });
    await waitFor(() => expect(within(panel).getByText("Watching Bruno", { selector: "small" })).toBeInTheDocument());
  });
});

describe("room: what's on my stage is reported (spec 0104)", () => {
  const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);
  async function anaAndBruno() {
    const server = installFakeApi({ me: member });
    server.streams = [
      someoneSharing("Ana Souza", 3, "screen", undefined, minutesAgo(10)),
      someoneSharing("Bruno Lima", 7, "screen", undefined, minutesAgo(5)),
    ];
    renderRoom();
    await connected();
    act(() => {
      lastRoom().publishScreen("user-3");
      lastRoom().publishScreen("user-7");
    });
    await screen.findByLabelText("Ana's shared screen");
    return server;
  }
  const watchCalls = (server: { calls: { method: string; path: string }[] }) =>
    server.calls.filter((c) => c.method === "PUT" && c.path === "/api/streams/watching");

  it("reports whose stream is on my stage, once it settles", async () => {
    const server = await anaAndBruno();

    await waitFor(() => expect(server.myWatch).toEqual({ sharerId: 3, kind: "screen" }), { timeout: 3000 });
    expect(watchCalls(server)).toHaveLength(1);
  });

  it("sends one report for quick changes, the last one", async () => {
    const server = await anaAndBruno();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /^Watch Bruno/ }));
    await user.click(screen.getByRole("button", { name: /^Watch Ana/ }));
    await user.click(screen.getByRole("button", { name: /^Watch Bruno/ }));

    await waitFor(() => expect(server.myWatch).toEqual({ sharerId: 7, kind: "screen" }), { timeout: 3000 });
    expect(watchCalls(server)).toHaveLength(1);
  });

  it("tries a failed report again a moment later", async () => {
    const server = installFakeApi({ me: member });
    server.failures.set("PUT /api/streams/watching", { status: 503, body: { status: 503, detail: "Deploying" } });
    server.streams = [someoneSharing("Ana Souza", 3)];
    renderRoom();
    await connected();
    act(() => {
      lastRoom().publishScreen("user-3");
    });
    await waitFor(() => expect(watchCalls(server)).toHaveLength(1), { timeout: 3000 });

    server.failures.delete("PUT /api/streams/watching");

    await waitFor(() => expect(server.myWatch).toEqual({ sharerId: 3, kind: "screen" }), { timeout: 5000 });
  }, 12000);

  it("reports nothing while the stream is still loading", async () => {
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Ana Souza", 3)];
    renderRoom();
    await connected();
    await screen.findByRole("heading", { name: "Ana" });

    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(watchCalls(server)).toHaveLength(0);

    act(() => {
      lastRoom().publishScreen("user-3");
    });
    await waitFor(() => expect(server.myWatch).toEqual({ sharerId: 3, kind: "screen" }), { timeout: 3000 });
  }, 10000);

  it("reports it again when the API forgot it (a restart)", async () => {
    const server = await anaAndBruno();
    await waitFor(() => expect(server.myWatch).not.toBeNull(), { timeout: 3000 });
    // A poll or two, so the room sees the API has it.
    await new Promise((resolve) => setTimeout(resolve, FAST_POLL * 3));

    act(() => {
      server.myWatch = null;
    });

    // The next poll (every 2 s) shows it's gone; the report follows after 1 s.
    await waitFor(() => expect(watchCalls(server)).toHaveLength(2), { timeout: 5000 });
    expect(server.myWatch).toEqual({ sharerId: 3, kind: "screen" });
  }, 12000);
});

describe("room: whose sound plays", () => {
  const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);
  const thumbnails = () => screen.getByRole("list", { name: /other streams/i });

  async function anaAndBrunoWithSound() {
    const server = installFakeApi({ me: member });
    server.streams = [
      someoneSharing("Ana Souza", 3, "screen", undefined, minutesAgo(10)),
      someoneSharing("Bruno Lima", 7, "screen", undefined, minutesAgo(5)),
    ];
    renderRoom();
    await connected();
    act(() => {
      lastRoom().publishScreen("user-3", { withSound: true });
      lastRoom().publishScreen("user-7", { withSound: true });
    });
    await screen.findByLabelText("Ana's shared screen");
    const room = lastRoom();
    const sound = (id: string) => room.remoteParticipants.get(id)!.tracks.get("screen_share_audio")!;
    return { server, room, sound };
  }

  // A preview's buttons, in the row that pointing at it opens (spec 0131).
  async function rowOf(name: string, user = userEvent.setup()) {
    await user.hover(within(thumbnails()).getByRole("button", { name: (n) => n.startsWith(`Watch ${name}`) }));
    return screen.findByRole("group", { name: `${name}'s sounds` });
  }

  it("plays only the big person's sound until I turn a preview on; a preview's is downloaded only while I hear it (spec 0131)", async () => {
    const { room, sound } = await anaAndBrunoWithSound();
    const user = userEvent.setup();

    expect(sound("user-3").attached).toHaveLength(1);
    await waitFor(() => expect(room.soundPublication("user-7")!.setSubscribed).toHaveBeenLastCalledWith(false));
    expect(sound("user-7").attached).toHaveLength(0);

    // Bruno stays small; I turn his sound on from his row: it's downloaded and plays.
    await user.click(within(await rowOf("Bruno", user)).getByRole("button", { name: "Unmute Bruno's screen sound" }));
    await waitFor(() => expect(room.soundPublication("user-7")!.setSubscribed).toHaveBeenLastCalledWith(true));
    await waitFor(() => expect(sound("user-7").attached).toHaveLength(1));
    expect((sound("user-7").attached[0] as HTMLAudioElement).muted).toBe(false);
    expect(screen.getByRole("heading", { name: "Ana" })).toBeInTheDocument();

    // Off again: no longer downloaded.
    await user.click(within(await rowOf("Bruno", user)).getByRole("button", { name: "Mute Bruno's screen sound" }));
    await waitFor(() => expect(room.soundPublication("user-7")!.setSubscribed).toHaveBeenLastCalledWith(false));
    expect(sound("user-7").attached).toHaveLength(0);
  });

  it("plays a preview's voice I turn on, at its own volume, while it stays small (spec 0131, AC-1)", async () => {
    const { room, sound } = await anaAndBrunoWithSound();
    const user = userEvent.setup();
    let voice!: ReturnType<typeof room.publishVoice>;
    act(() => {
      voice = room.publishVoice("user-7");
    });
    expect(voice.attached).toHaveLength(0);

    await user.click(within(await rowOf("Bruno", user)).getByRole("button", { name: "Unmute Bruno's voice" }));
    await waitFor(() => expect(voice.attached).toHaveLength(1));
    await waitFor(() => expect(room.voicePublication("user-7")!.setSubscribed).toHaveBeenLastCalledWith(true));
    expect((voice.attached[0] as HTMLAudioElement).muted).toBe(false);
    expect(screen.getByRole("heading", { name: "Ana" })).toBeInTheDocument();

    // Its own volume: moving Bruno's slider leaves Ana's, on the stage, where it was.
    const ana = sound("user-3").attached[0] as HTMLAudioElement;
    const before = ana.volume;
    const row = await rowOf("Bruno", user);
    await user.hover(within(row).getByRole("button", { name: "Mute Bruno's voice" }));
    fireEvent.change(await within(row).findByRole("slider", { name: "Bruno's voice volume" }), { target: { value: "0.2" } });
    expect((voice.attached[0] as HTMLAudioElement).volume).toBeCloseTo(0.2);
    await user.hover(within(row).getByRole("button", { name: "Unmute Bruno's screen sound" }));
    fireEvent.change(await within(row).findByRole("slider", { name: "Bruno's screen sound volume" }), { target: { value: "0.1" } });
    expect(ana.volume).toBeCloseTo(before);
  });

  it("locks a screen without sound on mute, for the big player and a thumbnail, until it gets sound (spec 0098)", async () => {
    localStorage.setItem("xove.watch.volume", "0.6");
    const server = installFakeApi({ me: member });
    server.streams = [
      someoneSharing("Ana Souza", 3, "screen", undefined, minutesAgo(10)),
      someoneSharing("Bruno Lima", 7, "screen", undefined, minutesAgo(5)),
    ];
    renderRoom();
    await connected();
    act(() => {
      lastRoom().publishScreen("user-3");
      lastRoom().publishScreen("user-7");
    });
    await screen.findByLabelText("Ana's shared screen");

    expect(within(stage()).getByRole("button", { name: "No sound in this stream" })).toHaveAttribute("aria-disabled", "true");
    expect(within(stage()).queryByRole("slider", { name: "Screen sound volume" })).not.toBeInTheDocument();
    // A preview without sound greys its sound button, in its place (specs 0123 and 0131).
    expect(within(await rowOf("Bruno")).getByRole("button", { name: "Bruno: No screen sound" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    // Ana changes to a window with sound: her sound works again, at my volume.
    act(() => {
      lastRoom().publishSound("user-3");
    });
    const button = await within(stage()).findByRole("button", { name: "Mute the screen's sound" });
    expect(button).not.toHaveAttribute("aria-disabled");
    await userEvent.setup().hover(button);
    const slider = within(stage()).getByRole("slider", { name: "Screen sound volume" });
    await waitFor(() => expect(slider.closest("[inert]")).toBeNull());
    expect(slider).toHaveValue("0.6");
    localStorage.clear();
  });

  it("greys a camera's screen sound, and its voice while the mic is off (spec 0123)", async () => {
    const server = installFakeApi({ me: member });
    server.streams = [
      someoneSharing("Ana Souza", 3, "camera", undefined, minutesAgo(10)),
      someoneSharing("Bruno Lima", 7, "camera", undefined, minutesAgo(5)),
    ];
    renderRoom();
    await connected();
    act(() => {
      lastRoom().publishCamera("user-3");
      lastRoom().publishCamera("user-7");
    });
    await screen.findByLabelText("Ana's camera");

    expect(within(stage()).getByRole("button", { name: "No screen sound" })).toHaveAttribute("aria-disabled", "true");
    expect(within(stage()).getByRole("button", { name: "Ana's mic is off" })).toHaveAttribute("aria-disabled", "true");
    const row = await rowOf("Bruno");
    expect(within(row).getByRole("button", { name: "Bruno: No screen sound" })).toHaveAttribute("aria-disabled", "true");
    expect(within(row).getByRole("button", { name: "Bruno: Bruno's mic is off" })).toHaveAttribute("aria-disabled", "true");
  });

  it("keeps each person's switch wherever they are, while switching (specs 0123 AC-4, 0131 AC-1)", async () => {
    const { room, sound } = await anaAndBrunoWithSound();
    const user = userEvent.setup();

    // Ana is big: mute her sound.
    await user.click(within(stage()).getByRole("button", { name: "Mute the screen's sound" }));
    expect((sound("user-3").attached[0] as HTMLAudioElement).muted).toBe(true);
    // Turn Bruno's on from his preview, without opening him.
    await user.click(within(await rowOf("Bruno", user)).getByRole("button", { name: "Unmute Bruno's screen sound" }));
    expect(screen.getByRole("heading", { name: "Ana" })).toBeInTheDocument();

    // Watch Bruno: his sound stays on. Ana, small now, stays muted and isn't downloaded.
    await user.click(within(thumbnails()).getByRole("button", { name: /^Watch Bruno/ }));
    await waitFor(() => expect(sound("user-7").attached).toHaveLength(1));
    expect((sound("user-7").attached[0] as HTMLAudioElement).muted).toBe(false);
    await waitFor(() => expect(room.soundPublication("user-3")!.setSubscribed).toHaveBeenLastCalledWith(false));

    // Back to Ana: still muted; Bruno, small again, still heard.
    await user.click(within(thumbnails()).getByRole("button", { name: /^Watch Ana/ }));
    await waitFor(() => expect(sound("user-3").attached).toHaveLength(1));
    expect((sound("user-3").attached[0] as HTMLAudioElement).muted).toBe(true);
    expect(room.soundPublication("user-7")!.setSubscribed).toHaveBeenLastCalledWith(true);
  });

  it("plays the new big person's sound after a swap, and mutes the one that left", async () => {
    const { room, sound } = await anaAndBrunoWithSound();
    const user = userEvent.setup();

    await user.click(within(thumbnails()).getByRole("button", { name: /^Watch Bruno/ }));

    await waitFor(() => {
      expect(sound("user-7").attached).toHaveLength(1);
      expect(room.soundPublication("user-3")!.setSubscribed).toHaveBeenLastCalledWith(false);
    });
  });
});

describe("room: my settings for each of my streams", () => {
  afterEach(() => localStorage.clear());

  it("changes the camera's quality live from the settings, apart from the screen's", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);
    await user.click(within(controls()).getByRole("button", { name: /turn on your camera/i }));
    await waitFor(() => expect(myLiveStream(server, "camera")).toBeDefined());
    const camera = lastRoom().localParticipant.lastCamera!;

    const menu = await openMenu(user, "Camera");
    expect(menu.queryByRole("radio", { name: "1080p" })).not.toBeInTheDocument();
    await pickInMenu(user, "480p", "Camera");

    await waitFor(() => {
      expect(myLiveStream(server, "camera")?.settings.quality).toBe("480p");
      expect(camera.setPublishingQuality).toHaveBeenLastCalledWith(capOf("480p"));
    });
    expect(myLiveStream(server, "screen")?.settings.quality).toBe("1080p");
    await openMenu(user, "Screen");
    expect(tickedQuality()).toBe("1080p");
    expect(localStorage.getItem("xove.camera.quality")).toBe("480p");
  });
});

describe("room: the feed names each stream", () => {
  it("says when someone turns their camera on and off", async () => {
    const server = installFakeApi({ me: member });
    renderRoom();
    await connected();

    act(() => {
      server.streams = [someoneSharing("Bruno Lima", 7, "camera")];
    });
    expect(await screen.findByText(/bruno turned on their camera/i)).toBeInTheDocument();

    act(() => {
      server.streams = [];
    });
    expect(await screen.findByText(/bruno turned off their camera/i)).toBeInTheDocument();
  });
});

// ---- found in review (spec 0060) ----

describe("room: after the review", () => {
  afterEach(() => localStorage.clear());
  const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);
  const thumbnails = () => screen.getByRole("list", { name: /other streams/i });

  it("keeps sending my screen when registering it again fails for another reason, and tries again", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);
    server.failures.set("POST /api/streams", { status: 503, body: { status: 503, detail: "Starting up" } });

    act(() => {
      server.streams = [];
    });
    await waitFor(() => expect(server.calls.filter((c) => c.method === "POST" && c.path === "/api/streams").length).toBeGreaterThan(1));
    expect(lastRoom().localParticipant.isScreenShareEnabled).toBe(true);

    server.failures.delete("POST /api/streams");
    await waitFor(() => expect(myLiveStream(server)).toBeDefined());
    expect(lastRoom().localParticipant.isScreenShareEnabled).toBe(true);
  });

  it("puts a refused screen change back even when the camera changes right after", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);
    await user.click(within(controls()).getByRole("button", { name: /turn on your camera/i }));
    await waitFor(() => expect(myLiveStream(server, "camera")).toBeDefined());
    server.failures.set("POST /api/streams/screen/settings", {
      status: 409,
      body: { status: 409, detail: "Only the person sharing can change how their stream is sent." },
    });

    // Both changes go out before either answer comes back.
    fireEvent.click((await openMenu(user, "Screen")).getByRole("radio", { name: "480p" }));
    fireEvent.click((await openMenu(user, "Camera")).getByRole("radio", { name: "480p" }));

    await waitFor(() => expect(myLiveStream(server, "camera")?.settings.quality).toBe("480p"));
    await openMenu(user, "Screen");
    await waitFor(() => {
      expect(tickedQuality()).toBe("1080p");
      expect(lastRoom().localParticipant.screens[0].track.setPublishingQuality).toHaveBeenLastCalledWith(capOf("1080p"));
    });
  });

  it("forgets a viewer's pick once that person stops, even if they share again later", async () => {
    const server = installFakeApi({ me: member });
    server.streams = [
      someoneSharing("Ana Souza", 3, "screen", undefined, minutesAgo(10)),
      someoneSharing("Bruno Lima", 7, "screen", undefined, minutesAgo(5)),
    ];
    renderRoom();
    await connected();
    await screen.findByRole("heading", { name: "Ana" });
    await userEvent.setup().click(within(thumbnails()).getByRole("button", { name: /^Watch Bruno/ }));
    expect(screen.getByRole("heading", { name: "Bruno" })).toBeInTheDocument();

    act(() => {
      server.streams = server.streams.filter((st) => st.userId !== 7);
    });
    expect(await screen.findByRole("heading", { name: "Ana" })).toBeInTheDocument();
    act(() => {
      server.streams = [...server.streams, someoneSharing("Bruno Lima", 7)];
    });

    await within(stage()).findByRole("button", { name: /^Watch Bruno/ });
    expect(screen.getByRole("heading", { name: "Ana" })).toBeInTheDocument();
  });

  it("swaps the facecam for one person only", async () => {
    const server = installFakeApi({ me: member });
    server.streams = [
      someoneSharing("Ana Souza", 3, "screen", undefined, minutesAgo(10)),
      someoneSharing("Ana Souza", 3, "camera", undefined, minutesAgo(10)),
      someoneSharing("Bruno Lima", 7, "screen", undefined, minutesAgo(5)),
      someoneSharing("Bruno Lima", 7, "camera", undefined, minutesAgo(5)),
    ];
    renderRoom();
    await connected();
    act(() => {
      for (const id of ["user-3", "user-7"]) {
        lastRoom().publishScreen(id);
        lastRoom().publishCamera(id);
      }
    });
    await screen.findByLabelText("Ana's shared screen");
    const user = userEvent.setup();
    const facecam = () => stage().querySelector("[data-facecam]") as HTMLElement;

    await user.click(within(facecam()).getByRole("button", { name: "Swap views" }));
    expect(within(facecam()).getByLabelText("Ana's shared screen")).toBeInTheDocument();

    await user.click(within(thumbnails()).getByRole("button", { name: /^Watch Bruno/ }));
    expect(within(facecam()).getByLabelText("Bruno's camera")).toBeInTheDocument();
  });
});

describe("room: the stage hugs the picture (spec 0107)", () => {
  const shapeOfStage = () =>
    Number(screen.getByRole("region", { name: "Shared screen" }).querySelector("[data-shape]")?.getAttribute("data-shape"));

  /** The browser learns the picture's size, or a new one when the sharer resizes the window. */
  const pictureSize = (video: HTMLElement, width: number, height: number) =>
    act(() => {
      Object.defineProperty(video, "videoWidth", { configurable: true, get: () => width });
      Object.defineProperty(video, "videoHeight", { configurable: true, get: () => height });
      video.dispatchEvent(new Event("resize"));
    });

  it("is 16:9 while empty and while a stream loads, then takes the picture's shape", async () => {
    const server = installFakeApi({ me: member });
    renderRoom();
    await connected();
    await screen.findByLabelText("0 of 6 live, 6 seats open");
    expect(shapeOfStage()).toBeCloseTo(16 / 9);

    server.streams = [someoneSharing("Bruno Lima", 7)];
    await screen.findByText(/loading bruno's screen/i);
    expect(shapeOfStage()).toBeCloseTo(16 / 9);

    act(() => {
      lastRoom().publishScreen("user-7");
    });
    const video = await screen.findByLabelText("Bruno's shared screen");
    pictureSize(video, 1840, 1000);
    expect(shapeOfStage()).toBeCloseTo(1.84);

    // A portrait monitor: taller than 16:9.
    pictureSize(video, 1080, 1920);
    expect(shapeOfStage()).toBeCloseTo(0.5625);
  });
});

describe("room: under the stage (spec 0107)", () => {
  it("shows who's watching the stage: me included, never the sharer", async () => {
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Bruno Lima", 7)];
    // Ana watches Bruno; Bruno's own stage shows himself, which doesn't count.
    server.watching = [
      { userId: 3, sharerId: 7, kind: "screen", mine: false },
      { userId: 7, sharerId: 7, kind: "screen", mine: false },
    ];
    renderRoom();
    await connected();
    act(() => {
      lastRoom().join("user-3", "Ana Souza");
      lastRoom().join("user-7", "Bruno Lima");
      lastRoom().publishScreen("user-7");
    });

    expect(await screen.findByText("1 watching")).toBeInTheDocument();
    // Once my stage is reported (after a second of stillness), I count too.
    expect(await screen.findByText("2 watching", undefined, { timeout: 4000 })).toBeInTheDocument();
  });

  it("invites someone to go live on an empty stage, naming who's here", async () => {
    installFakeApi({ me: member });
    renderRoom();
    await connected();
    expect(await screen.findByText("Nobody else is here yet.")).toBeInTheDocument();

    act(() => {
      lastRoom().join("user-3", "Ana Souza");
      lastRoom().join("user-7", "Bruno Lima");
    });

    expect(screen.getByRole("heading", { name: "Nobody is sharing yet" })).toBeInTheDocument();
    expect(await screen.findByText("Ana and Bruno are here.")).toBeInTheDocument();
  });
});

/** The window as a phone held upright (spec 0158), and turning it. */
function phoneWindow(upright = true) {
  const listeners = new Set<() => void>();
  let phone = upright;
  window.matchMedia = ((query: string) => ({
    get matches() {
      return query === NARROW_UPRIGHT_QUERY && phone;
    },
    media: query,
    onchange: null,
    addEventListener: (_: string, l: () => void) => listeners.add(l),
    removeEventListener: (_: string, l: () => void) => listeners.delete(l),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  return {
    turn(upright: boolean) {
      phone = upright;
      act(() => listeners.forEach((l) => l()));
    },
  };
}

describe("room: on a phone held upright (spec 0158)", () => {
  const desktopMatchMedia = window.matchMedia;
  afterEach(() => {
    window.matchMedia = desktopMatchMedia;
    vi.restoreAllMocks();
  });

  it("has the wordmark, then people, the bell and my account at the far right, and no footer", async () => {
    phoneWindow();
    installFakeApi({ me: member });
    const { container } = renderRoom();
    await connected();

    const header = container.querySelector("header")!;
    const buttons = within(header).getAllByRole("button");
    const names = buttons.map((b) => b.getAttribute("aria-label") ?? "");
    const people = names.findIndex((n) => /people here|person here/.test(n));
    const bell = names.indexOf("Activity");
    const account = names.findIndex((n) => /: account,/.test(n));
    expect(people).toBeGreaterThanOrEqual(0);
    expect(bell).toBeGreaterThan(people);
    expect(account).toBeGreaterThan(bell);
    expect(within(header).getByRole("img", { name: "Xovê" })).toBeInTheDocument();
    // The desktop's activity pill and footer aren't there; the footer's items are in my menu.
    expect(within(header).queryByRole("button", { name: /^Activity:/ })).toBeNull();
    expect(container.querySelector("footer")).toBeNull();
  });

  // Spec 0107: the settings as a bottom sheet, with only the Camera tab.
  it("opens the settings from the cog as a bottom sheet over the page, Screen greyed out", async () => {
    // A real phone: touch first, small, upright (a narrow desktop window keeps its Screen tab).
    const real = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      ...real(query),
      matches: [TOUCH_QUERY, SMALL_QUERY, PORTRAIT_QUERY, NARROW_UPRIGHT_QUERY].includes(query),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    installFakeApi({ me: member });
    renderRoom();
    await connected();
    const user = userEvent.setup();

    await user.click(within(stage()).getByRole("button", { name: "Settings" }));

    const sheet = screen.getByRole("dialog", { name: "Settings" });
    expect(sheet).toHaveAttribute("data-variant", "sheet");
    expect(stage()).not.toContainElement(sheet);
    expect(within(sheet).getAllByRole("tab").map((t) => t.textContent)).toEqual(["Screen", "Camera", "Voice"]);
    expect(within(sheet).getByRole("tab", { name: "Screen" })).toHaveAttribute("aria-disabled", "true");
    expect(within(sheet).getByRole("tab", { name: "Camera" })).toHaveAttribute("aria-selected", "true");
    await user.click(within(sheet).getByRole("button", { name: "Close settings" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Settings" })).not.toBeInTheDocument());
  });

  it("never leaves the round buttons behind the settings sheet with a tall player (spec 0118)", async () => {
    window.matchMedia = ((query: string) => ({
      ...desktopMatchMedia(query),
      matches: [TOUCH_QUERY, SMALL_QUERY, PORTRAIT_QUERY, NARROW_UPRIGHT_QUERY].includes(query),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    const server = installFakeApi({ me: member });
    // Someone live: the stage's own buttons (nobody live, the cog is beside the ways to start, spec 0138).
    server.streams = [someoneSharing("Marina", 2)];
    renderRoom();
    await connected();
    act(() => {
      lastRoom().publishScreen("user-2");
    });
    await screen.findByLabelText("Marina's shared screen");
    const user = userEvent.setup();
    const overlay = stage().querySelector("[data-overlay]") as HTMLElement;
    const controls = stage().querySelector("[data-buttons]")!.closest("[class*=controls]") as HTMLElement;
    // A tall player: its row's bottom at 600 (the frame from 56, the row 496 px down, 48 px tall);
    // the sheet's top at 348.
    let rowTop = 496;
    vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (this: HTMLElement) {
      return this.dataset.variant === "sheet" ? 348 : this.hasAttribute("data-buttons") ? rowTop : 0;
    });
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
      return this.hasAttribute("data-buttons") ? 48 : 0;
    });
    const frameTop = 56;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function () {
      return { top: frameTop, bottom: frameTop + 560, left: 0, right: 412, width: 412, height: 560, x: 0, y: frameTop } as DOMRect;
    });
    // A viewer opens the settings from Go live's menu.
    await user.click(within(stage()).getByRole("button", { name: "Go live" }));
    await user.click(within(stage()).getByRole("menuitem", { name: "Settings" }));
    // 600 - (348 - 8) = 260 px up, both layers together.
    await waitFor(() => expect(controls.style.translate).toBe("0 -260px"));
    expect(overlay.style.translate).toBe("0 -260px");
    // A short player (a widescreen stream): already clear, nothing moves.
    rowTop = 180;
    act(() => window.dispatchEvent(new Event("resize")));
    expect(controls.style.translate).toBe("");
    await user.click(screen.getByRole("button", { name: "Close settings" }));
    await waitFor(() => expect(overlay.style.translate).toBe(""));
  });

  it("puts the footer's items at the end of my account menu", async () => {
    phoneWindow();
    installFakeApi({ me: member });
    renderRoom();
    const user = userEvent.setup();
    await user.click(await connected());
    expect(screen.getByText(/Made by Hbrauveres/)).toBeInTheDocument();
  });

  it("with nobody live, says so and lists who's here as cards", async () => {
    phoneWindow();
    const server = installFakeApi({ me: member });
    server.here = [{ userId: MY_USER_ID, since: new Date(Date.now() - 5 * 60_000).toISOString(), mine: true }];
    renderRoom();
    await connected();

    expect(screen.getByRole("heading", { name: "Nobody is sharing yet" })).toBeInTheDocument();
    expect(screen.getByText("6 seats open")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Here/ })).toBeInTheDocument();
    expect(await screen.findByText("here 5 min")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Live now/ })).toBeNull();
  });

  it("with someone live, shows them under the stage and the others in the feed, which stays silent", async () => {
    phoneWindow();
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Bruno Lima", 7), someoneSharing("Ana Souza", 3)];
    renderRoom();
    await connected();
    const room = lastRoom();
    act(() => {
      room.publishScreen("user-7", { withSound: true });
      room.publishScreen("user-3", { withSound: true });
    });

    expect(await screen.findByRole("heading", { level: 2, name: "Bruno · Screen" })).toBeInTheDocument();
    const feed = screen.getByRole("region", { name: /Live now/ });
    expect(within(feed).getByRole("heading", { level: 3, name: "Ana · Screen" })).toBeInTheDocument();
    expect(within(feed).queryByRole("heading", { name: /Bruno/ })).toBeNull();
    expect(screen.queryByRole("heading", { name: /^Here/ })).toBeNull();
    // Only the stage's sound is downloaded.
    await waitFor(() => expect(room.soundPublication("user-3")!.isSubscribed).toBe(false));
    expect(room.soundPublication("user-7")!.isSubscribed).toBe(true);

    // A tap puts Ana on the stage.
    await userEvent.setup().click(within(feed).getByRole("button", { name: "Watch Ana's screen" }));
    expect(await screen.findByRole("heading", { level: 2, name: "Ana · Screen" })).toBeInTheDocument();
  });

  it("has no LIVE badge over the stage: LIVE is in the line under it", async () => {
    phoneWindow();
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Bruno Lima", 7)];
    renderRoom();
    await connected();
    act(() => {
      lastRoom().publishScreen("user-7");
    });
    const video = await screen.findByLabelText("Bruno's shared screen");
    const frame = video.closest("[data-chrome]") as HTMLElement;
    expect(within(frame).queryByText("LIVE")).toBeNull();
    const info = screen.getByRole("heading", { level: 2, name: "Bruno · Screen" }).closest("[data-compact]") as HTMLElement;
    expect(within(info).getByText("LIVE")).toBeInTheDocument();
  });

  it("keeps the same video playing when the phone turns", async () => {
    const win = phoneWindow();
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Bruno Lima", 7)];
    renderRoom();
    await connected();
    act(() => {
      lastRoom().publishScreen("user-7");
    });
    const video = await screen.findByLabelText("Bruno's shared screen");

    win.turn(false);
    expect(await screen.findByRole("heading", { name: "Bruno" })).toBeInTheDocument();
    expect(screen.getByLabelText("Bruno's shared screen")).toBe(video);

    win.turn(true);
    expect(await screen.findByRole("heading", { name: "Bruno · Screen" })).toBeInTheDocument();
    expect(screen.getByLabelText("Bruno's shared screen")).toBe(video);
  });
});

describe("room: the empty stage glows (spec 0123)", () => {
  const desktopMatchMedia = window.matchMedia;
  afterEach(() => {
    window.matchMedia = desktopMatchMedia;
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it.each([
    ["on desktop", false],
    ["on a phone", true],
  ])("lights its corners at the ambilight's brightness %s, with no ambilight canvas", async (_, upright) => {
    if (upright) phoneWindow();
    installFakeApi({ me: member });
    const { container } = renderRoom();
    await connected();
    const glow = container.querySelector("[data-corner-glow]") as HTMLElement;
    expect(glow.querySelectorAll("i")).toHaveLength(4);
    expect(Number(glow.style.opacity)).toBeGreaterThan(0);
    expect(container.querySelector("[data-ambilight]")).toBeNull();
  });

  it("goes dark with the ambilight switched off", async () => {
    localStorage.setItem("xove.ambilight.on", "false");
    installFakeApi({ me: member });
    const { container } = renderRoom();
    await connected();
    expect((container.querySelector("[data-corner-glow]") as HTMLElement).style.opacity).toBe("0");
  });
});

describe("room: swiping the phone's stage (spec 0159)", () => {
  const desktopMatchMedia = window.matchMedia;
  afterEach(() => {
    window.matchMedia = desktopMatchMedia;
    vi.restoreAllMocks();
  });

  /** Three people sharing their screens, in this order (the longest first), on a phone. */
  async function threeLive(withSound = false) {
    phoneWindow();
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 400, height: 225 } as DOMRect);
    const server = installFakeApi({ me: member });
    const ago = (s: number) => new Date(Date.now() - s * 1000);
    server.streams = [
      someoneSharing("Marina", 2, "screen", undefined, ago(300)),
      someoneSharing("Rafa", 3, "screen", undefined, ago(200)),
      someoneSharing("Duda", 4, "screen", undefined, ago(100)),
    ];
    renderRoom();
    await connected();
    const room = lastRoom();
    act(() => {
      for (const id of ["user-2", "user-3", "user-4"]) room.publishScreen(id, { withSound });
    });
    await screen.findByRole("heading", { level: 2, name: "Marina · Screen" });
    return { server, room };
  }

  const onStage = (name: string) => screen.findByRole("heading", { level: 2, name: `${name} · Screen` });
  /** A drag on the stage's picture, quick, of `dx` pixels. */
  function swipe(dx: number, on?: Element) {
    const target = on ?? screen.getByRole("region", { name: /shared screen/i }).querySelector("video")!;
    fireEvent.pointerDown(target, { pointerId: 1, clientX: 200, clientY: 100, button: 0 });
    fireEvent.pointerMove(target, { pointerId: 1, clientX: 200 + dx, clientY: 102 });
    fireEvent.pointerUp(target, { pointerId: 1, clientX: 200 + dx, clientY: 102 });
  }

  it("goes to the next person on a swipe left, the previous on a swipe right, wrapping around", async () => {
    await threeLive();
    // Each swipe slides the next one in; the next swipe waits until it's in place.
    const slidIn = () => new Promise((r) => setTimeout(r, 250));
    swipe(-200);
    await onStage("Rafa");
    await slidIn();
    swipe(-200);
    await onStage("Duda");
    await slidIn();
    swipe(-200);
    await onStage("Marina");
    await slidIn();
    swipe(200);
    await onStage("Duda");
  });

  it("changes nothing on a short drag", async () => {
    await threeLive();
    swipe(-20);
    await new Promise((r) => setTimeout(r, 450));
    expect(screen.getByRole("heading", { level: 2, name: "Marina · Screen" })).toBeInTheDocument();
  });

  it("leaves the stage alone when the drag starts on a round button or the fullscreen button", async () => {
    await threeLive();
    const stageRegion = screen.getByRole("region", { name: /shared screen/i });
    swipe(-200, stageRegion.querySelector("[data-no-swipe] button[aria-label*=sound i]")!);
    swipe(-200, within(stageRegion).getByRole("button", { name: "Fullscreen" }));
    await new Promise((r) => setTimeout(r, 450));
    expect(screen.getByRole("heading", { level: 2, name: "Marina · Screen" })).toBeInTheDocument();
  });

  it("leaves the stage alone when the drag starts on the facecam", async () => {
    phoneWindow();
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 400, height: 225 } as DOMRect);
    const server = installFakeApi({ me: member });
    server.streams = [
      someoneSharing("Bruno", 7, "screen", undefined, new Date(Date.now() - 300_000)),
      someoneSharing("Bruno", 7, "camera", undefined, new Date(Date.now() - 300_000)),
      someoneSharing("Ana", 3, "screen"),
    ];
    renderRoom();
    await connected();
    act(() => {
      lastRoom().publishScreen("user-7");
      lastRoom().publishCamera("user-7");
      lastRoom().publishScreen("user-3");
    });
    const facecam = await waitFor(() => {
      const f = document.querySelector("[data-facecam]");
      expect(f).not.toBeNull();
      return f!;
    });
    swipe(-200, facecam);
    await new Promise((r) => setTimeout(r, 450));
    expect(screen.getByRole("heading", { level: 2, name: "Bruno · Screen with camera" })).toBeInTheDocument();
  });

  it("moves the sound, the feed and what I watch with the stage", async () => {
    const { server, room } = await threeLive(true);
    swipe(-200);
    await onStage("Rafa");
    await waitFor(() => expect(room.soundPublication("user-3")!.isSubscribed).toBe(true));
    expect(room.soundPublication("user-2")!.isSubscribed).toBe(false);
    const feed = screen.getByRole("region", { name: /Live now/ });
    expect(within(feed).getByRole("heading", { name: "Marina · Screen" })).toBeInTheDocument();
    await waitFor(
      () =>
        expect(server.calls.filter((c) => c.method === "PUT" && c.path === "/api/streams/watching").at(-1)?.body).toEqual({
          sharerId: 3,
          kind: "screen",
        }),
      { timeout: 3000 },
    );
  });

  it("ignores a mostly up-and-down drag", async () => {
    await threeLive();
    const video = screen.getByRole("region", { name: /shared screen/i }).querySelector("video")!;
    fireEvent.pointerDown(video, { pointerId: 1, clientX: 200, clientY: 100, button: 0 });
    fireEvent.pointerMove(video, { pointerId: 1, clientX: 140, clientY: 220 });
    fireEvent.pointerUp(video, { pointerId: 1, clientX: 140, clientY: 220 });
    await new Promise((r) => setTimeout(r, 450));
    expect(screen.getByRole("heading", { level: 2, name: "Marina · Screen" })).toBeInTheDocument();
  });

  it("doesn't swipe on the desktop layout", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 400, height: 225 } as DOMRect);
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Marina", 2, "screen", undefined, new Date(Date.now() - 300_000)), someoneSharing("Rafa", 3)];
    renderRoom();
    await connected();
    act(() => {
      lastRoom().publishScreen("user-2");
      lastRoom().publishScreen("user-3");
    });
    await screen.findByRole("heading", { name: "Marina" });
    swipe(-200);
    await new Promise((r) => setTimeout(r, 450));
    expect(screen.getByRole("heading", { name: "Marina" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Watch Rafa" })).toBeNull();
  });

  it("has a dot per person live, and a tap on one puts them on the stage", async () => {
    await threeLive();
    const user = userEvent.setup();
    expect(screen.getByRole("button", { name: "Watch Marina" })).toHaveAttribute("aria-current", "true");
    await user.click(screen.getByRole("button", { name: "Watch Duda" }));
    await onStage("Duda");
    expect(screen.getByRole("button", { name: "Watch Duda" })).toHaveAttribute("aria-current", "true");
  });
});

/** A phone (touch, small), sideways at first; `turn()` holds it upright or sideways again. */
function phoneSideways() {
  const listeners = new Set<() => void>();
  let portrait = false;
  const answer = (q: string) =>
    q === TOUCH_QUERY || q === SMALL_QUERY ? true : q === PORTRAIT_QUERY || q === NARROW_UPRIGHT_QUERY ? portrait : false;
  window.matchMedia = ((query: string) => ({
    get matches() {
      return answer(query);
    },
    media: query,
    onchange: null,
    addEventListener: (_: string, l: () => void) => listeners.add(l),
    removeEventListener: (_: string, l: () => void) => listeners.delete(l),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  return {
    turn() {
      portrait = !portrait;
      act(() => listeners.forEach((l) => l()));
    },
  };
}

describe("room: on a phone sideways (spec 0160)", () => {
  const desktopMatchMedia = window.matchMedia;
  afterEach(() => {
    window.matchMedia = desktopMatchMedia;
    vi.restoreAllMocks();
  });

  async function sidewaysWith(names: string[], withSound = false) {
    const phone = phoneSideways();
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 732, height: 412 } as DOMRect);
    const server = installFakeApi({ me: member });
    server.streams = names.map((n, i) => someoneSharing(n, i + 2, "screen", undefined, new Date(Date.now() - (300 - i * 50) * 1000)));
    const view = renderRoom();
    await connected();
    const room = lastRoom();
    act(() => {
      names.forEach((_, i) => room.publishScreen(`user-${i + 2}`, { withSound }));
    });
    return { phone, server, room, view };
  }
  const stageLayer = () => screen.getByRole("region", { name: /shared screen/i });
  /** A quick drag on the picture. */
  function drag(dx: number, dy: number, on?: Element) {
    const target = on ?? stageLayer().querySelector("video")!;
    fireEvent.pointerDown(target, { pointerId: 1, clientX: 400, clientY: 250, button: 0 });
    fireEvent.pointerMove(target, { pointerId: 1, clientX: 400 + dx, clientY: 250 + dy });
    fireEvent.pointerUp(target, { pointerId: 1, clientX: 400 + dx, clientY: 250 + dy });
  }
  const row = () => screen.queryByRole("region", { name: /Live now/ });

  it("puts the stage's buttons on the screen, clear of the arrow, Go live in the empty corner (spec 0131, AC-6)", async () => {
    await sidewaysWith(["Marina", "Rafa"], true);
    await screen.findByRole("heading", { level: 2, name: "Marina · Screen" });
    const sound = await within(stageLayer()).findByRole("button", { name: "Mute the screen's sound" });
    // On the stage's box, the whole screen, at its bottom like the arrow; not on the picture's view (spec 0133).
    expect(stageLayer().querySelector("video")!.closest("[class*=view]")!.contains(sound)).toBe(false);
    expect(stageLayer().querySelector("video")!.closest("[data-chrome]")!.contains(sound)).toBe(true);
    expect(stageLayer()).toHaveAttribute("data-row-arrow");
    // A phone held sideways has no fullscreen button: Go live takes its corner.
    expect(within(stageLayer()).queryByRole("button", { name: /fullscreen/i })).toBeNull();
    expect(stageLayer()).toHaveAttribute("data-no-full");
  });

  it("has no header, logo or footer; the top line has who's on the stage and my buttons", async () => {
    const { view } = await sidewaysWith(["Marina", "Rafa"]);
    expect(await screen.findByRole("heading", { level: 2, name: "Marina · Screen" })).toBeInTheDocument();
    expect(view.container.querySelector("header")).toBeNull();
    expect(view.container.querySelector("footer")).toBeNull();
    expect(screen.queryByRole("img", { name: "Xovê" })).toBeNull();
    const top = stageLayer().querySelector("[data-fades]") as HTMLElement;
    expect(within(top).getByText("LIVE")).toBeInTheDocument();
    expect(within(top).getByRole("button", { name: /people here/ })).toBeInTheDocument();
    expect(within(top).getByRole("button", { name: "Activity" })).toBeInTheDocument();
    expect(within(top).getByRole("button", { name: /: account,/ })).toBeInTheDocument();
    // No feed or cards under the stage: the row replaces them.
    expect(screen.queryByRole("heading", { name: /^Here/ })).toBeNull();
  });

  it("with nobody live, shows the camera waiting, Nobody is sharing yet and the seats, and the camera button", async () => {
    phoneSideways();
    installFakeApi({ me: member });
    renderRoom();
    await connected();
    expect(screen.getByRole("heading", { name: "Nobody is sharing yet" })).toBeInTheDocument();
    expect(screen.getByText("6 seats open")).toBeInTheDocument();
    expect(stageLayer().querySelectorAll("[data-mark]")).toHaveLength(4);
    expect(within(stageLayer()).getByRole("button", { name: /camera/i })).toBeInTheDocument();
    // Over the empty stage nothing fades.
    expect(stageLayer()).not.toHaveAttribute("data-chrome");
  });

  it("keeps the same video when the phone turns upright and back", async () => {
    const { phone } = await sidewaysWith(["Marina"]);
    const video = await screen.findByLabelText("Marina's shared screen");
    phone.turn();
    // Upright: the info row under the stage, and the feed.
    expect(await screen.findByRole("heading", { name: /^Live now/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Marina's shared screen")).toBe(video);
    phone.turn();
    expect(screen.getByLabelText("Marina's shared screen")).toBe(video);
  });

  it("fades the controls after a while, keeping an open row; a tap hides it with them, the next brings it back (spec 0131, AC-7)", async () => {
    await sidewaysWith(["Marina", "Rafa"]);
    const picture = await screen.findByLabelText("Marina's shared screen");
    const tap = () => {
      fireEvent.pointerDown(picture, { pointerId: 2, pointerType: "touch", clientX: 300, clientY: 200 });
      fireEvent.pointerUp(picture, { pointerId: 2, pointerType: "touch", clientX: 300, clientY: 200 });
    };
    drag(0, -150);
    await waitFor(() => expect(row()).not.toBeNull());
    expect(stageLayer()).toHaveAttribute("data-chrome", "shown");

    // The idle fade leaves the open row.
    await waitFor(() => expect(stageLayer()).toHaveAttribute("data-chrome", "hidden"), { timeout: 4000 });
    expect(row()).not.toBeNull();

    // A tap shows the rest; the next hides everything, the row too; the one after brings it all back.
    tap();
    expect(stageLayer()).toHaveAttribute("data-chrome", "shown");
    tap();
    expect(stageLayer()).toHaveAttribute("data-chrome", "hidden");
    expect(row()).toBeNull();
    tap();
    expect(stageLayer()).toHaveAttribute("data-chrome", "shown");
    expect(row()).not.toBeNull();
  });

  it("opens the row with a swipe up and closes it with a swipe down; a tap in it changes the stage, silently", async () => {
    const { room } = await sidewaysWith(["Marina", "Rafa"], true);
    await screen.findByLabelText("Marina's shared screen");
    expect(row()).toBeNull();
    drag(0, -150);
    const open = await waitFor(() => {
      const r = row();
      expect(r).not.toBeNull();
      return r!;
    });
    expect(open).toHaveTextContent("2 of 6");
    // The controls end above the open row: the stylesheet lifts them by this (spec 0133).
    const layout = open.closest("[data-layout]")!;
    expect(layout).toHaveAttribute("data-row-open");
    drag(0, 150);
    await waitFor(() => expect(row()).toBeNull());
    expect(layout).not.toHaveAttribute("data-row-open");
    await userEvent.setup().click(screen.getByRole("button", { name: "Show the other streams" }));
    const again = await waitFor(() => row()!);
    await userEvent.setup().click(within(again).getByRole("button", { name: "Watch Rafa's screen" }));
    expect(await screen.findByRole("heading", { level: 2, name: "Rafa · Screen" })).toBeInTheDocument();
    await waitFor(() => expect(room.soundPublication("user-2")!.isSubscribed).toBe(false));
  });

  it("keeps an open panel, and the bar it hangs from, past the idle time", async () => {
    await sidewaysWith(["Marina", "Rafa"]);
    await screen.findByLabelText("Marina's shared screen");
    fireEvent.pointerDown(stageLayer(), { pointerId: 3, clientX: 10, clientY: 10, button: 0 });
    await userEvent.setup().click(within(stageLayer()).getByRole("button", { name: "Activity" }));
    expect(screen.getByRole("dialog", { name: "Activity" })).toBeInTheDocument();
    // A tap on a phone may not focus the button: only the open panel holds the bar.
    act(() => (document.activeElement as HTMLElement | null)?.blur());
    await new Promise((r) => setTimeout(r, 3200));
    expect(stageLayer()).toHaveAttribute("data-chrome", "shown");
    expect(screen.getByRole("dialog", { name: "Activity" })).toBeInTheDocument();
  }, 8000);

  it("opens the row only from a drag on the picture, not the black sides or the facecam", async () => {
    phoneSideways();
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 732, height: 412 } as DOMRect);
    const server = installFakeApi({ me: member });
    server.streams = [
      someoneSharing("Bruno", 7, "screen", undefined, new Date(Date.now() - 300_000)),
      someoneSharing("Bruno", 7, "camera", undefined, new Date(Date.now() - 300_000)),
      someoneSharing("Ana", 3, "screen"),
    ];
    renderRoom();
    await connected();
    act(() => {
      lastRoom().publishScreen("user-7");
      lastRoom().publishCamera("user-7");
      lastRoom().publishScreen("user-3");
    });
    const facecam = await waitFor(() => document.querySelector("[data-facecam]")!);
    drag(0, -150, facecam);
    drag(0, -150, stageLayer());
    await new Promise((r) => setTimeout(r, 100));
    expect(row()).toBeNull();
  });

  it("doesn't open the row from the empty stage, and has no tab with nobody else live", async () => {
    phoneSideways();
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 732, height: 412 } as DOMRect);
    const server = installFakeApi({ me: member });
    renderRoom();
    await connected();
    const empty = stageLayer().querySelector("[data-empty]")!;
    drag(0, -150, empty);
    act(() => {
      server.streams = [someoneSharing("Marina", 2)];
    });
    act(() => {
      lastRoom().publishScreen("user-2");
    });
    await screen.findByRole("heading", { level: 2, name: "Marina · Screen" });
    expect(row()).toBeNull();
    expect(screen.queryByRole("button", { name: "Show the other streams" })).toBeNull();
  });

  it("shows the dots too, one per person live, and a tap on one changes the stage", async () => {
    await sidewaysWith(["Marina", "Rafa"]);
    await screen.findByLabelText("Marina's shared screen");
    expect(within(stageLayer()).getByRole("button", { name: "Watch Marina" })).toHaveAttribute("aria-current", "true");
    await userEvent.setup().click(within(stageLayer()).getByRole("button", { name: "Watch Rafa" }));
    expect(await screen.findByRole("heading", { level: 2, name: "Rafa · Screen" })).toBeInTheDocument();
  });

  it("changes the stream on a left or right drag, as upright, and drags on the buttons don't open the row", async () => {
    await sidewaysWith(["Marina", "Rafa"]);
    await screen.findByLabelText("Marina's shared screen");
    drag(-300, 0);
    expect(await screen.findByRole("heading", { level: 2, name: "Rafa · Screen" })).toBeInTheDocument();
    expect(row()).toBeNull();
    await new Promise((r) => setTimeout(r, 450));
    drag(300, 0);
    expect(await screen.findByRole("heading", { level: 2, name: "Marina · Screen" })).toBeInTheDocument();
    // On a phone sideways there's no fullscreen button (spec 0171): the round buttons are the controls.
    drag(0, -150, stageLayer().querySelector("[data-no-swipe] button[aria-label*=sound i]")!);
    await new Promise((r) => setTimeout(r, 100));
    expect(row()).toBeNull();
  });

  it("opens the settings over the cog, on the stage so they're over the top bar too (spec 0107, design decision 9)", async () => {
    const user = userEvent.setup();
    await sidewaysWith(["Marina"]);
    // Watching, not live: the settings are in Go live's menu (spec 0123).
    await user.click(await screen.findByRole("button", { name: "Go live" }));
    await user.click(screen.getByRole("menuitem", { name: "Settings" }));
    const panel = screen.getByRole("dialog", { name: "Settings" });
    expect(panel).toHaveAttribute("data-variant", "popover");
    expect(panel.parentElement).toBe(stageLayer());
    // The stage tells it where the cog and the round buttons are.
    expect(stageLayer().style.getPropertyValue("--cog-x")).toMatch(/px$/);
    expect(stageLayer().style.getPropertyValue("--above-row")).toMatch(/px$/);
  });
});

describe("room: the full-screen view on a phone (spec 0171)", () => {
  const desktopMatchMedia = window.matchMedia;
  afterEach(() => {
    window.matchMedia = desktopMatchMedia;
    vi.restoreAllMocks();
  });

  /** A phone held upright, someone live. */
  async function upright() {
    const phone = phoneSideways();
    phone.turn();
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Marina", 2), someoneSharing("Rafa", 3)];
    const view = renderRoom();
    await connected();
    act(() => {
      lastRoom().publishScreen("user-2");
      lastRoom().publishScreen("user-3");
    });
    const video = await screen.findByLabelText("Marina's shared screen");
    return { phone, view, video };
  }
  const layoutOf = (view: ReturnType<typeof renderRoom>) =>
    view.container.querySelector("[data-layout]")?.getAttribute("data-layout");

  it("the button opens the sideways layout without turning, and leaves it, with the same video", async () => {
    const { view, video } = await upright();
    expect(layoutOf(view)).toBe("phone");
    const user = userEvent.setup();
    await user.click(within(stage()).getByRole("button", { name: "Full-screen view" }));
    expect(layoutOf(view)).toBe("sideways");
    expect(screen.getByLabelText("Marina's shared screen")).toBe(video);
    await user.click(within(stage()).getByRole("button", { name: "Exit full-screen view" }));
    expect(layoutOf(view)).toBe("phone");
    expect(screen.getByLabelText("Marina's shared screen")).toBe(video);
  });

  it("sideways there's no button; turning back returns to where it was", async () => {
    const { phone, view } = await upright();
    await userEvent.setup().click(within(stage()).getByRole("button", { name: "Full-screen view" }));
    phone.turn();
    expect(layoutOf(view)).toBe("sideways");
    expect(within(stage()).queryByRole("button", { name: /full-screen view|fullscreen/i })).toBeNull();
    phone.turn();
    expect(layoutOf(view)).toBe("sideways");
    await userEvent.setup().click(within(stage()).getByRole("button", { name: "Exit full-screen view" }));
    phone.turn();
    phone.turn();
    expect(layoutOf(view)).toBe("phone");
  });

  it("keeps the button when the only stream stops in the full view, and it leaves it (spec 0111)", async () => {
    const phone = phoneSideways();
    phone.turn();
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Marina", 2)];
    const view = renderRoom();
    await connected();
    act(() => {
      lastRoom().publishScreen("user-2");
    });
    await screen.findByLabelText("Marina's shared screen");
    const user = userEvent.setup();
    await user.click(within(stage()).getByRole("button", { name: "Full-screen view" }));
    expect(layoutOf(view)).toBe("sideways");
    act(() => {
      server.streams = [];
      lastRoom().unpublish("user-2", "screen_share");
    });
    // The empty stage, still in the full view.
    expect(await within(stage()).findByRole("heading", { name: "Go live" })).toBeInTheDocument();
    expect(layoutOf(view)).toBe("sideways");
    await user.click(within(stage()).getByRole("button", { name: "Exit full-screen view" }));
    expect(layoutOf(view)).toBe("phone");
  });

  it("puts the facecam under the top bar on entering the full view (spec 0111)", async () => {
    const phone = phoneSideways();
    phone.turn();
    const server = installFakeApi({ me: member });
    server.streams = [someoneSharing("Marina", 2, "screen"), someoneSharing("Marina", 2, "camera")];
    renderRoom();
    await connected();
    act(() => {
      lastRoom().publishScreen("user-2");
      lastRoom().publishCamera("user-2");
    });
    await screen.findByLabelText("Marina's shared screen");
    const facecam = () => stage().querySelector("[data-facecam]") as HTMLElement;
    expect(facecam().style.top).toBe("4%");
    await userEvent.setup().click(within(stage()).getByRole("button", { name: "Full-screen view" }));
    expect(facecam().style.top).toBe("18%");
  });

  it("draws the round buttons and the fullscreen button on the stage's box, the whole screen, not on the picture, in the full view (specs 0112 and 0133)", async () => {
    const { video } = await upright();
    await userEvent.setup().click(within(stage()).getByRole("button", { name: "Full-screen view" }));
    const box = video.closest("[data-chrome]") as HTMLElement;
    const buttons = stage().querySelector("[data-buttons]")!;
    const exit = within(stage()).getByRole("button", { name: "Exit full-screen view" });
    // The box holds them; the picture's view doesn't.
    expect(box.contains(buttons)).toBe(true);
    expect(box.contains(exit)).toBe(true);
    const view = video.closest("[class*=view]")!;
    expect(view.contains(buttons)).toBe(false);
    expect(view.contains(exit)).toBe(false);
  });

  it("ends the controls above the settings sheet, its height read from the sheet, and back on closing (specs 0112 and 0133)", async () => {
    await upright();
    const user = userEvent.setup();
    await user.click(within(stage()).getByRole("button", { name: "Full-screen view" }));
    // A 915 px screen, the sheet's top at 415.
    vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (this: HTMLElement) {
      return this.dataset.variant === "sheet" ? 415 : 0;
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top: 0, bottom: 915, left: 0, right: 412, width: 412, height: 915, x: 0, y: 0 } as DOMRect);
    // Watching, not live: the settings are in Go live's menu (spec 0123).
    await user.click(within(stage()).getByRole("button", { name: "Go live" }));
    await user.click(within(stage()).getByRole("menuitem", { name: "Settings" }));
    // The sheet covers 915 - 415 = 500 px: the controls end above it (the stylesheet reads it).
    await waitFor(() => expect(stage().style.getPropertyValue("--sheet-h")).toBe("500px"));
    expect(stage()).toHaveAttribute("data-sheet-lift");
    // Read again (the address bar, the keyboard, another stream): it stays.
    act(() => window.dispatchEvent(new Event("resize")));
    expect(stage().style.getPropertyValue("--sheet-h")).toBe("500px");
    await user.click(screen.getByRole("button", { name: "Close settings" }));
    await waitFor(() => expect(stage().style.getPropertyValue("--sheet-h")).toBe(""));
    expect(stage()).not.toHaveAttribute("data-sheet-lift");
  });

  it("never asks the browser for the player's fullscreen on a phone", async () => {
    await upright();
    const frame = screen.getByLabelText("Marina's shared screen").closest("[data-chrome]") as HTMLElement;
    frame.requestFullscreen = vi.fn(async () => {});
    await userEvent.setup().click(within(stage()).getByRole("button", { name: "Full-screen view" }));
    expect(frame.requestFullscreen).not.toHaveBeenCalled();
  });
});

describe("room: my voice (spec 0123)", () => {
  afterEach(() => localStorage.clear());
  const mic = () => lastRoom().localParticipant.mic;

  it("shows my mic only while I'm live, off at first, and turns my voice on and off; it takes no place", async () => {
    const server = installFakeApi({ me: member });
    const user = await readyRoom();
    expect(within(stage()).queryByRole("button", { name: /your voice/i })).not.toBeInTheDocument();

    await startSharing(user);
    await user.click(within(stage()).getByRole("button", { name: "Share your voice" }));
    await waitFor(() => expect(mic()).not.toBeNull());
    expect(within(stage()).getByRole("button", { name: "Mute your voice" })).toHaveAttribute("aria-pressed", "true");
    // The API lists my screen alone: a voice is never a stream.
    expect(server.streams.filter((st) => st.userId === MY_USER_ID)).toHaveLength(1);
    expect(screen.getByLabelText("1 of 6 live, 5 seats open")).toBeInTheDocument();

    await user.click(within(stage()).getByRole("button", { name: "Mute your voice" }));
    await waitFor(() => expect(mic()).toBeNull());
  });

  it("asks for the mic once, however fast the mic button is tapped twice", async () => {
    installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);
    const local = lastRoom().localParticipant;
    const asked = local.createTracks.mock.calls.length;
    const button = within(stage()).getByRole("button", { name: "Share your voice" });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(mic()).not.toBeNull());
    expect(local.createTracks.mock.calls.length - asked).toBe(1);
  });

  it("leaves the voice off and says how to allow it when the browser blocks the mic", async () => {
    installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);
    lastRoom().localParticipant.nextMic = "NotAllowedError";
    await user.click(within(stage()).getByRole("button", { name: "Share your voice" }));
    expect(await screen.findByText(/blocked the microphone/i)).toBeInTheDocument();
    expect(mic()).toBeNull();
    expect(within(stage()).getByRole("button", { name: "Share your voice" })).toHaveAttribute("aria-pressed", "false");
  });

  it("turns the voice off when my last stream stops: a voice never travels alone", async () => {
    installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);
    await user.click(within(stage()).getByRole("button", { name: "Share your voice" }));
    await waitFor(() => expect(mic()).not.toBeNull());
    await user.click(within(controls()).getByRole("button", { name: /stop sharing/i }));
    await waitFor(() => expect(mic()).toBeNull());
  });

  it("the Voice tab: the mic picked and its processing, applied live and remembered; the line moves without a restart", async () => {
    installFakeApi({ me: member });
    const user = await readyRoom();
    await startSharing(user);
    await user.click(within(stage()).getByRole("button", { name: "Share your voice" }));
    await waitFor(() => expect(mic()).not.toBeNull());
    const panel = await openMenu(user, "Voice");

    await user.click(panel.getByRole("button", { name: /^Microphone: / }));
    await user.click(panel.getByRole("radio", { name: "MacBook Pro microphone" }));
    const track = mic()!.track;
    await waitFor(() => expect(track.restartTrack).toHaveBeenLastCalledWith(expect.objectContaining({ deviceId: { ideal: "mic-2" } })));

    await user.click(panel.getByRole("switch", { name: "Echo cancellation" }));
    expect(panel.getByRole("switch", { name: "Echo cancellation" })).toHaveAttribute("aria-checked", "false");
    await waitFor(() => expect(track.restartTrack).toHaveBeenLastCalledWith(expect.objectContaining({ echoCancellation: false })));
    const restarts = track.restartTrack.mock.calls.length;

    fireEvent.change(panel.getByRole("slider", { name: "Mic sensitivity" }), { target: { value: "0.4" } });
    expect(track.restartTrack.mock.calls.length).toBe(restarts);

    expect(JSON.parse(localStorage.getItem("xove.mic.processing")!)).toMatchObject({ echoCancellation: false, sensitivity: 0.4 });
    expect(localStorage.getItem("xove.mic.device")).toBe("mic-2");
  });
});
