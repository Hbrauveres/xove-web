import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { capOf } from "@services/livekit-service";
import { moveFakeTimers, onFakeClock } from "../../../../../testing/factories/clock.factory";
import { aRoomSession } from "../../../../../testing/factories/room-session.factory";
import {
  member,
  openMenu,
  pickInMenu,
  readyRoom,
  stage,
  startSharing,
  tickedQuality,
} from "../../../../../testing/factories/stage-steps.factory";
import { installFakeApi, myLiveStream } from "../../../../../testing/fakeApi";
import { lastRoom } from "../../../../../testing/fakeLiveKit";
import { RoomSessionContext } from "../../../stores/room-session";
import type { SettingsSession } from "../../../types/settings.types";
import { PANEL_MS } from "./constants/settings-panel.constants";
import { SettingsPanel } from "./settings-panel.component";

function setup(props: Partial<SettingsSession> = {}) {
  const handlers = { onClose: vi.fn(), onPreviewCamera: vi.fn(), onPrefsChange: vi.fn() };
  const all: SettingsSession = {
    open: true,
    screenTab: true,
    mine: { screen: false, camera: false },
    prefs: { screen: { quality: "1080p", mode: "smooth" }, camera: { quality: "720p", mode: "smooth" } },
    cameras: [{ deviceId: "cam-1", label: "Logitech C920" }],
    cameraId: "cam-1",
    onChangeWindow: vi.fn(),
    onPickCamera: vi.fn(),
    ...handlers,
    ...props,
  };
  const inRoom = (settings: SettingsSession) => (
    <RoomSessionContext.Provider value={aRoomSession({ settings })}>
      <SettingsPanel />
    </RoomSessionContext.Provider>
  );
  const user = userEvent.setup({ advanceTimers: moveFakeTimers });
  const view = render(inRoom(all));
  return {
    user,
    ...handlers,
    rerender: (next: Partial<SettingsSession>) => view.rerender(inRoom({ ...all, ...next })),
  };
}
const panel = () => screen.getByRole("dialog", { name: "Settings" });
const tab = (name: string) => within(panel()).getByRole("tab", { name });

describe("the settings panel", () => {
  it("is a dialog beside the stage, open on its first usable tab", () => {
    setup({ screenTab: false });
    expect(tab("Camera")).toHaveAttribute("aria-selected", "true");
    cleanup();
    setup();
    expect(panel()).toHaveAttribute("open");
    expect(
      within(panel())
        .getAllByRole("tab")
        .map((t) => t.textContent),
    ).toEqual(["Screen", "Camera", "Voice"]);
    expect(tab("Screen")).toHaveAttribute("aria-selected", "true");
  });

  it("closes from its ✕ and with Escape", async () => {
    const { user, onClose } = setup();
    await user.click(within(panel()).getByRole("button", { name: "Close settings" }));
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("leaves once closed and slid out", () => {
    vi.useFakeTimers();
    const { rerender } = setup();
    rerender({ open: false });
    expect(screen.getByRole("dialog", { hidden: true })).toHaveAttribute("inert");
    act(() => vi.advanceTimersByTime(PANEL_MS));
    expect(screen.queryByRole("dialog", { hidden: true })).not.toBeInTheDocument();
  });

  it("previews the camera only while the Camera tab is open and the camera isn't sent", async () => {
    const { user, onPreviewCamera, rerender } = setup();
    expect(onPreviewCamera).not.toHaveBeenCalled();
    await user.click(tab("Camera"));
    expect(onPreviewCamera).toHaveBeenLastCalledWith(true);
    await user.click(tab("Screen"));
    expect(onPreviewCamera).toHaveBeenLastCalledWith(false);
    await user.click(tab("Camera"));
    rerender({ mine: { screen: false, camera: true } });
    expect(onPreviewCamera).toHaveBeenLastCalledWith(false);
  });

  it("takes the focus on its chosen tab, and gives it back to the cog when it closes", async () => {
    const cog = document.createElement("button");
    document.body.append(cog);
    cog.focus();
    const { user, rerender } = setup();
    expect(tab("Screen")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(tab("Camera")).toHaveFocus();
    rerender({ open: false });
    expect(cog).toHaveFocus();
    cog.remove();
  });

  it("goes to a setting a live button asks for, cueing it", () => {
    const { rerender } = setup({ mine: { screen: true, camera: false } });
    fireEvent.click(tab("Camera"));
    rerender({ mine: { screen: true, camera: false }, goTo: { kind: "screen", n: 1 } });
    expect(tab("Screen")).toHaveAttribute("aria-selected", "true");
    expect(within(panel()).getByRole("button", { name: "Change" }).querySelector("[data-cue]")).not.toBeNull();
  });
});

// The wiring: the stage over the real room session, its steps in testing/factories/stage-steps.
describe("room: changing my streams from the settings", () => {
  beforeEach(() => {
    onFakeClock();
  });

  it("changes the quality live from my player: same stream, and the API tells everyone", async () => {
    const server = installFakeApi({ me: member() });
    const user = await readyRoom();
    await startSharing(user);
    const local = lastRoom().localParticipant;
    const video = local.screens[0]!.track;

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

  it("changes the camera's quality live from the settings, apart from the screen's", async () => {
    const server = installFakeApi({ me: member() });
    const user = await readyRoom();
    await startSharing(user);
    await user.click(within(stage()).getByRole("button", { name: /turn on your camera/i }));
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
