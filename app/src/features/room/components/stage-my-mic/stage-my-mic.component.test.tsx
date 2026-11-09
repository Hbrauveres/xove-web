import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { StageMyMic } from "./stage-my-mic.component";
import { installFakeApi, MY_USER_ID } from "../../../../testing/fakeApi";
import { lastRoom } from "../../../../testing/fakeLiveKit";
import { onFakeClock } from "../../../../testing/factories/clock.factory";
import { member, stage, readyRoom, startSharing, openMenu } from "../../../../testing/factories/stage-steps.factory";
import userEvent from "@testing-library/user-event";
describe("my mic", () => {
  it("says what a click does, and is pressed while it's on", async () => {
    const onClick = vi.fn();
    render(<StageMyMic on size="m" onClick={onClick} />);
    await userEvent.click(screen.getByRole("button", { name: "Mute your voice", pressed: true }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("never wears the talking cue: my speaking shows on my face", () => {
    render(<StageMyMic on size="l" />);
    expect(screen.getByRole("button", { name: "Mute your voice" })).not.toHaveAttribute("data-cue");
  });
});

// The wiring: the stage over the real room session, its steps in testing/factories/stage-steps.
describe("room: my voice", () => {
  beforeEach(() => {
    onFakeClock();
  });

  const mic = () => lastRoom().localParticipant.mic;

  it("shows my mic only while I'm live, off at first, and turns my voice on and off; it takes no place", async () => {
    const server = installFakeApi({ me: member() });
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

  it("turns the voice off when my last stream stops: a voice never travels alone", async () => {
    installFakeApi({ me: member() });
    const user = await readyRoom();
    await startSharing(user);
    await user.click(within(stage()).getByRole("button", { name: "Share your voice" }));
    await waitFor(() => expect(mic()).not.toBeNull());
    await user.click(within(stage()).getByRole("button", { name: /stop sharing/i }));
    await waitFor(() => expect(mic()).toBeNull());
  });

  it("the Voice tab: the mic picked and its processing, applied live and remembered; the line moves without a restart", async () => {
    installFakeApi({ me: member() });
    const user = await readyRoom();
    await startSharing(user);
    await user.click(within(stage()).getByRole("button", { name: "Share your voice" }));
    await waitFor(() => expect(mic()).not.toBeNull());
    const panel = await openMenu(user, "Voice");

    await user.click(panel.getByRole("button", { name: /^Microphone: / }));
    await user.click(panel.getByRole("menuitemradio", { name: "MacBook Pro microphone" }));
    const track = mic()!.track;
    await waitFor(() =>
      expect(track.restartTrack).toHaveBeenLastCalledWith(expect.objectContaining({ deviceId: { ideal: "mic-2" } })),
    );

    await user.click(panel.getByRole("switch", { name: "Echo cancellation" }));
    expect(panel.getByRole("switch", { name: "Echo cancellation" })).toHaveAttribute("aria-checked", "false");
    await waitFor(() =>
      expect(track.restartTrack).toHaveBeenLastCalledWith(expect.objectContaining({ echoCancellation: false })),
    );
    const restarts = track.restartTrack.mock.calls.length;

    fireEvent.change(panel.getByRole("slider", { name: "Mic sensitivity" }), { target: { value: "0.4" } });
    expect(track.restartTrack.mock.calls.length).toBe(restarts);

    expect(JSON.parse(localStorage.getItem("xove.mic.processing")!)).toMatchObject({
      echoCancellation: false,
      sensitivity: 0.4,
    });
    expect(localStorage.getItem("xove.mic.device")).toBe("mic-2");
  });
});
