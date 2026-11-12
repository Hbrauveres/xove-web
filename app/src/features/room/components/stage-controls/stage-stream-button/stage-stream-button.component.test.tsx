import { render, screen, act, within, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { aStreamControls } from "@testing/factories/stream-controls.factory";
import { StageStreamButton } from "./stage-stream-button.component";
import { cameraCaptureOptions, capOf } from "@services/livekit-service";
import { installFakeApi, MY_USER_ID, myLiveStream, someoneSharing } from "../../../../../testing/fakeApi";
import { FakeLocalScreenTrack, lastRoom } from "../../../../../testing/fakeLiveKit";
import { clockUser, onFakeClock } from "../../../../../testing/factories/clock.factory";
import { appConfig } from "@services/app-config-service";
import {
  member,
  stage,
  connected,
  renderStage,
  readyRoom,
  pickScreen,
  startSharing,
  openMenu,
} from "../../../../../testing/factories/stage-steps.factory";
import type { User } from "../../../../../testing/factories/stage-steps.factory";
import userEvent from "@testing-library/user-event";
describe("one of my streams' buttons", () => {
  it("starts its stream, or stops it while it's live", async () => {
    const controls = aStreamControls();
    const { rerender } = render(<StageStreamButton kind="camera" {...controls} />);
    await userEvent.click(screen.getByRole("button", { name: "Turn on your camera" }));
    expect(controls.onStart).toHaveBeenCalledWith("camera");
    rerender(<StageStreamButton kind="camera" {...controls} mine={{ screen: false, camera: true }} />);
    await userEvent.click(screen.getByRole("button", { name: "Turn off your camera", pressed: true }));
    expect(controls.onStop).toHaveBeenCalledWith("camera");
  });

  it("can't start in a full room, saying why", async () => {
    const controls = aStreamControls({ free: 0, places: 4 });
    render(<StageStreamButton kind="screen" {...controls} />);
    const share = screen.getByRole("button", { name: "Share your screen" });
    expect(share).toHaveAccessibleDescription(/^4 streams are live/);
    await userEvent.click(share);
    expect(controls.onStart).not.toHaveBeenCalled();
  });
});

// The wiring: the stage over the real room session, its steps in testing/factories/stage-steps.
describe("room: sharing", () => {
  beforeEach(() => {
    onFakeClock();
  });

  it("names what's shared by what the browser says was picked: a tab, a window, the whole screen", async () => {
    installFakeApi({ me: member() });
    const user = await readyRoom();
    lastRoom().localParticipant.nextSurface = "browser";
    await startSharing(user);

    const tab = await openMenu(user);
    expect(tab.getByText("A tab")).toBeInTheDocument();
  });
  it("starts with the settings remembered from last time", async () => {
    localStorage.setItem("xove.share.quality", "720p");
    localStorage.setItem("xove.share.mode", "sharp");
    const server = installFakeApi({ me: member() });
    const user = await readyRoom();

    await startSharing(user);

    const take = server.calls.find((c) => c.method === "POST" && c.path === "/api/streams");
    expect(take?.body).toMatchObject({ kind: "screen", quality: "720p", mode: "sharp" });
    expect(
      (lastRoom().localParticipant.lastCapture[0] as FakeLocalScreenTrack).setPublishingQuality,
    ).toHaveBeenLastCalledWith(capOf("720p"));
  });
  it("starts at once with the defaults the first time, sending the CSRF token, the kind, the connection and the settings", async () => {
    document.cookie = "XSRF-TOKEN=abc123";
    const server = installFakeApi({ me: member() });
    const user = await readyRoom();

    await pickScreen(user);

    expect(await screen.findByRole("heading", { name: "You" })).toBeInTheDocument();
    const local = lastRoom().localParticipant;
    expect(local.getDisplayMedia).toHaveBeenCalledTimes(1);
    expect(local.publishTrack).toHaveBeenCalled();
    const take = server.calls.find((c) => c.method === "POST" && c.path === "/api/streams");
    expect(take?.headers["X-XSRF-TOKEN"]).toBe("abc123");
    expect(take?.body).toEqual({
      kind: "screen",
      participantSid: "PA_me",
      trackSid: "TR_my_screen",
      quality: "1080p",
      mode: "smooth",
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // several screens at once, nobody is pushed out.
  it("shares alongside someone else, without asking anyone to stop", async () => {
    const server = installFakeApi({ me: member() });
    server.streams = [someoneSharing("Bruno", 7)];
    renderStage();
    await connected();
    await screen.findByRole("heading", { name: "Bruno" });
    const user = clockUser();

    // Watching someone, not live: Go live opens the ways to start.
    await user.click(within(stage()).getByRole("button", { name: "Go live" }));
    await user.click(within(stage()).getByRole("menuitem", { name: /share your screen/i }));

    await waitFor(() => expect(myLiveStream(server)).toBeDefined());
    expect(server.streams.map((st) => st.userId)).toEqual([7, MY_USER_ID]);
  });

  it("stops the video and ends the stream", async () => {
    const server = installFakeApi({ me: member() });
    const user = await readyRoom();
    await startSharing(user);

    await user.click(within(stage()).getByRole("button", { name: /stop sharing/i }));

    expect(await screen.findByLabelText("0 of 6 live, 6 seats open")).toBeInTheDocument();
    expect(lastRoom().localParticipant.isScreenShareEnabled).toBe(false);
    expect(myLiveStream(server)).toBeUndefined();
  });

  it("ends the stream when the browser's own Stop sharing bar is used", async () => {
    const server = installFakeApi({ me: member() });
    const user = await readyRoom();
    await startSharing(user);

    act(() => {
      lastRoom().browserStopsMyShare();
    });

    await waitFor(() => expect(myLiveStream(server)).toBeUndefined());
    expect(await screen.findByLabelText("0 of 6 live, 6 seats open")).toBeInTheDocument();
  });

  it("counts the places from the app's setting: a room set to 4 is full at 4", async () => {
    vi.stubGlobal("fetch", async () => Response.json({ streamPlaces: 4 }));
    await appConfig.load();
    const server = installFakeApi({ me: member() });
    server.places = 4;
    server.streams = [someoneSharing("P1", 1, "screen")];
    renderStage();
    await connected();
    expect(await screen.findByLabelText("1 of 4 live, 3 seats open")).toBeInTheDocument();

    server.streams = [1, 2].flatMap((id) => [
      someoneSharing(`P${id}`, id, "screen"),
      someoneSharing(`P${id}`, id, "camera"),
    ]);
    const user = clockUser();
    await user.click(await within(stage()).findByRole("button", { name: "Go live" }));
    const share = () => within(stage()).getByRole("menuitem", { name: /share your screen/i });
    await waitFor(() => expect(share()).toHaveAttribute("aria-disabled", "true"));
    expect(share()).toHaveAccessibleDescription(expect.stringMatching(/^4 streams are live/));
  });

  it("says the room is full of streams, and waits for a free place", async () => {
    const server = installFakeApi({ me: member() });
    server.streams = [1, 2, 3].flatMap((id) => [
      someoneSharing(`P${id}`, id, "screen"),
      someoneSharing(`P${id}`, id, "camera"),
    ]);
    renderStage();
    await connected();

    // Go live's ways to start are greyed out, still focusable, with the reason in their tooltip.
    const user = clockUser();
    await user.click(await within(stage()).findByRole("button", { name: "Go live" }));
    const share = () => within(stage()).getByRole("menuitem", { name: /share your screen/i });
    await waitFor(() => expect(share()).toHaveAttribute("aria-disabled", "true"));
    expect(share()).toHaveAccessibleDescription(expect.stringMatching(/6 streams are live/i));
    expect(within(stage()).getByRole("menuitem", { name: /turn on your camera/i })).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    act(() => {
      server.streams = server.streams.slice(1);
    });

    await waitFor(() => expect(share()).not.toHaveAttribute("aria-disabled"));
  });
});

describe("room: my camera", () => {
  beforeEach(() => {
    onFakeClock();
  });

  it("asks for the camera when the tab opens, and says how to allow it when it's refused", async () => {
    installFakeApi({ me: member() });
    const user = await readyRoom();
    lastRoom().localParticipant.nextCamera = "NotAllowedError";

    const tab = await openMenu(user, "Camera");

    expect(await tab.findByRole("status")).toHaveTextContent(
      /allow it for Xovê in your browser's or phone's settings/i,
    );
    expect(lastRoom().localParticipant.publishTrack).not.toHaveBeenCalled();
  });
  /** Clicks "Turn on your camera": it's sent at once. */
  async function turnOnCamera(user: User) {
    await user.click(within(stage()).getByRole("button", { name: /turn on your camera/i }));
    await waitFor(() =>
      expect(within(stage()).getByRole("button", { name: /turn off your camera/i })).toBeInTheDocument(),
    );
  }

  it("asks for the camera only after the click, never for a microphone, and sends it at once", async () => {
    const server = installFakeApi({ me: member() });
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

  it("sends the preview's camera as is when the camera button is pressed: no second ask", async () => {
    const server = installFakeApi({ me: member() });
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

  it("turns the camera off: stops sending it and ends its stream, the screen stays", async () => {
    const server = installFakeApi({ me: member() });
    const user = await readyRoom();
    await startSharing(user);
    await turnOnCamera(user);
    const local = lastRoom().localParticipant;
    const camera = local.lastCamera!;

    await user.click(within(stage()).getByRole("button", { name: /turn off your camera/i }));

    await waitFor(() => {
      expect(myLiveStream(server, "camera")).toBeUndefined();
      expect(local.unpublishTrack).toHaveBeenCalledWith(camera, true);
    });
    expect(camera.stopped).toBe(true);
    expect(myLiveStream(server, "screen")).toBeDefined();
  });
});
