import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { expect, it, describe, vi, beforeEach } from "vitest";
import { StageScreenSource } from "./stage-screen-source.component";
import { onFakeClock } from "../../../../testing/factories/clock.factory";
import { installFakeApi, myLiveStream } from "../../../../testing/fakeApi";
import { lastRoom } from "../../../../testing/fakeLiveKit";
import { member, stage, readyRoom, startSharing, openMenu } from "../../../../testing/factories/stage-steps.factory";
it("says what my screen share shows, or just my screen while it's unknown", () => {
  const { rerender } = render(<StageScreenSource surface="monitor" />);
  expect(screen.getByText("Your whole screen")).toBeInTheDocument();
  rerender(<StageScreenSource />);
  expect(screen.getByText("Your screen")).toBeInTheDocument();
});

// The wiring: the stage over the real room session, its steps in testing/factories/stage-steps.
describe("room: change window and pick a camera", () => {
  beforeEach(() => {
    onFakeClock();
  });

  it("with the settings open, resting on the live screen button goes to Screen and cues Change", async () => {
    installFakeApi({ me: member() });
    const user = await readyRoom();
    await startSharing(user);
    const real = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation((q: string) =>
      q.includes("hover: hover") ? ({ ...real(q), matches: true, media: q } as MediaQueryList) : real(q),
    );
    await openMenu(user, "Camera");
    const panel = within(await screen.findByRole("dialog", { name: "Settings" }));
    const stop = within(stage()).getByRole("button", { name: "Stop sharing your screen" });
    fireEvent.pointerEnter(stop.closest("[data-dropup]")!, { pointerType: "mouse" });
    await waitFor(() =>
      expect(panel.getByRole("tab", { name: (n) => n.startsWith("Screen") })).toHaveAttribute("aria-selected", "true"),
    );
    expect(panel.getByRole("button", { name: "Change" }).querySelector("[data-cue]")).not.toBeNull();
    expect(stop.closest("[data-dropup]")).toHaveAttribute("data-open", "false");
  });

  it("swaps what my screen shares from the settings, on the same stream", async () => {
    const server = installFakeApi({ me: member() });
    const user = await readyRoom();
    const local = lastRoom().localParticipant;
    local.nextPickerAudio = false;
    await startSharing(user);
    const started = myLiveStream(server);
    const video = local.screens[0]!.track;
    expect(within(stage()).getByRole("button", { name: "Stop sharing your screen" })).toHaveAccessibleDescription(
      expect.stringMatching(/no sound is being shared/i),
    );

    local.nextPickerAudio = true;
    await user.click((await openMenu(user)).getByRole("button", { name: "Change" }));

    await waitFor(() => {
      expect(video.replaceTrack).toHaveBeenCalled();
      expect(local.getDisplayMedia).toHaveBeenCalledTimes(2);
    });
    // Straight away, no new stream: the API's stream is the same one.
    expect(screen.getAllByRole("dialog").map((d) => d.getAttribute("aria-label"))).toEqual(["Settings"]);
    expect(myLiveStream(server)).toEqual(started);
    expect(server.calls.filter((c) => c.path === "/api/streams" && c.method === "POST")).toHaveLength(1);
    expect(local.screens).toHaveLength(1);
    // The new pick has sound: it's sent, and the badge goes.
    await waitFor(() =>
      expect(
        within(stage()).getByRole("button", { name: "Stop sharing your screen" }),
      ).not.toHaveAccessibleDescription(),
    );
    expect(local.screenAudio?.track.source).toBe("screen_share_audio");
  });

  it("switches my camera from the settings without stopping it", async () => {
    const server = installFakeApi({ me: member() });
    const user = await readyRoom();
    await user.click(within(stage()).getByRole("button", { name: /turn on your camera/i }));
    await waitFor(() => expect(myLiveStream(server, "camera")).toBeDefined());
    await within(stage()).findByRole("button", { name: /turn off your camera/i });
    const camera = lastRoom().localParticipant.lastCamera!;

    const menu = await openMenu(user, "Camera");
    await user.click(await menu.findByRole("button", { name: "Camera: Logitech C920" }));
    await user.click(menu.getByRole("menuitemradio", { name: "Integrated Webcam" }));

    await waitFor(() => expect(camera.restartTrack).toHaveBeenCalled());
    expect(lastRoom().localParticipant.camera?.track).toBe(camera);
    expect(myLiveStream(server, "camera")).toBeDefined();
    expect(await menu.findByRole("button", { name: "Camera: Integrated Webcam" })).toBeInTheDocument();
  });
});
