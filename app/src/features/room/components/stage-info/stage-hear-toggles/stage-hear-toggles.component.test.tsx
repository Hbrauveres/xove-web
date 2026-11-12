import { act, fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { REST_MS } from "../../../constants/sound-slider.constants";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { aSharer } from "@testing/factories/sharer.factory";
import type { Sharer } from "@features/room/types/room-view.types";
import { toastStore } from "@shared/stores/toast-store";
import type { Hearing } from "../../../types/sound.types";
import { StageHearToggles } from "./stage-hear-toggles.component";
import { installFakeApi, someoneSharing } from "../../../../../testing/fakeApi";
import { lastRoom } from "../../../../../testing/fakeLiveKit";
import { clockUser, onFakeClock } from "../../../../../testing/factories/clock.factory";
import { member, minutesAgo, stage, connected, renderStage } from "../../../../../testing/factories/stage-steps.factory";
import userEvent from "@testing-library/user-event";
const bruno = (extra: Partial<Sharer> = {}) => aSharer({ hasSound: true, hasVoice: true, ...extra });
const HEARD: Hearing = { sound: { volume: 1, muted: false }, voice: { volume: 0.7, muted: false } };

describe("a preview's two toggles", () => {
  it("mutes that person's sound or voice for me, each on its own, keeping its volume", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<StageHearToggles sharer={bruno()} hearing={HEARD} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Mute Bruno's voice" }));
    expect(onChange).toHaveBeenLastCalledWith({ ...HEARD, voice: { volume: 0.7, muted: true } });
    await user.click(screen.getByRole("button", { name: "Mute Bruno's screen sound" }));
    expect(onChange).toHaveBeenLastCalledWith({ ...HEARD, sound: { volume: 1, muted: true } });
  });

  it("shows what I muted as pressed", () => {
    render(
      <StageHearToggles
        sharer={bruno()}
        hearing={{ ...HEARD, voice: { volume: 0.7, muted: true } }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Unmute Bruno's voice" })).toHaveAttribute("aria-pressed", "true");
  });

  it("greys a sound that isn't there in its place, and a touch says why", async () => {
    const onChange = vi.fn();
    render(
      <StageHearToggles sharer={bruno({ hasSound: false, hasVoice: false })} hearing={HEARD} onChange={onChange} />,
    );
    const voice = screen.getByRole("button", { name: "Bruno: Bruno's mic is off" });
    expect(voice).toHaveAttribute("aria-disabled", "true");
    await userEvent.setup().click(voice);
    expect(onChange).not.toHaveBeenCalled();
    expect(toastStore.current()?.text).toBe("Bruno's mic is off");
  });

  it("unrolls no slider for a greyed sound: a rest on it opens nothing, as one on a sound that's there does", () => {
    vi.useFakeTimers();
    render(<StageHearToggles sharer={bruno({ hasVoice: false })} hearing={HEARD} onChange={() => {}} />);
    const row = screen.getByRole("group", { name: "Bruno's sounds" });
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Bruno: Bruno's mic is off" }));
    act(() => vi.advanceTimersByTime(REST_MS));
    expect(row).not.toHaveAttribute("data-open");
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Mute Bruno's screen sound" }));
    act(() => vi.advanceTimersByTime(REST_MS));
    expect(row).toHaveAttribute("data-open", "sound");
  });

  it("lights the voice while they speak, never once I've muted it (who's talking)", () => {
    const { rerender } = render(
      <StageHearToggles sharer={bruno({ speaking: true })} hearing={HEARD} onChange={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Mute Bruno's voice" })).toHaveAttribute("data-cue", "talking");
    rerender(
      <StageHearToggles
        sharer={bruno({ speaking: true })}
        hearing={{ ...HEARD, voice: { volume: 0.7, muted: true } }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Unmute Bruno's voice" })).not.toHaveAttribute("data-cue", "talking");
    rerender(<StageHearToggles sharer={bruno({ speaking: false })} hearing={HEARD} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Mute Bruno's voice" })).not.toHaveAttribute("data-cue", "talking");
  });
});

// The wiring: the stage over the real room session, its steps in testing/factories/stage-steps.
describe("room: whose sound plays", () => {
  beforeEach(() => {
    onFakeClock();
  });

  const thumbnails = () => screen.getByRole("list", { name: /other streams/i });

  async function anaAndBrunoWithSound() {
    const server = installFakeApi({ me: member() });
    server.streams = [
      someoneSharing("Ana Souza", 3, "screen", undefined, minutesAgo(10)),
      someoneSharing("Bruno Lima", 7, "screen", undefined, minutesAgo(5)),
    ];
    renderStage();
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

  // A preview's buttons, in the row that pointing at it opens.
  async function rowOf(name: string, user = clockUser()) {
    await user.hover(within(thumbnails()).getByRole("button", { name: (n) => n.startsWith(`Watch ${name}`) }));
    return screen.findByRole("group", { name: `${name}'s sounds` });
  }

  it("plays only the big person's sound until I turn a preview on; a preview's is downloaded only while I hear it", async () => {
    const { room, sound } = await anaAndBrunoWithSound();
    const user = clockUser();

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

  it("plays a preview's voice I turn on, at its own volume, while it stays small", async () => {
    const { room, sound } = await anaAndBrunoWithSound();
    const user = clockUser();
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
    fireEvent.change(await within(row).findByRole("slider", { name: "Bruno's voice volume" }), {
      target: { value: "0.2" },
    });
    expect((voice.attached[0] as HTMLAudioElement).volume).toBeCloseTo(0.2);
    await user.hover(within(row).getByRole("button", { name: "Unmute Bruno's screen sound" }));
    fireEvent.change(await within(row).findByRole("slider", { name: "Bruno's screen sound volume" }), {
      target: { value: "0.1" },
    });
    expect(ana.volume).toBeCloseTo(before);
  });

  it("locks a screen without sound on mute, for the big player and a thumbnail, until it gets sound", async () => {
    localStorage.setItem("xove.watch.volume", "0.6");
    const server = installFakeApi({ me: member() });
    server.streams = [
      someoneSharing("Ana Souza", 3, "screen", undefined, minutesAgo(10)),
      someoneSharing("Bruno Lima", 7, "screen", undefined, minutesAgo(5)),
    ];
    renderStage();
    await connected();
    act(() => {
      lastRoom().publishScreen("user-3");
      lastRoom().publishScreen("user-7");
    });
    await screen.findByLabelText("Ana's shared screen");

    expect(within(stage()).getByRole("button", { name: "No sound in this stream" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(within(stage()).queryByRole("slider", { name: "Screen sound volume" })).not.toBeInTheDocument();
    // A preview without sound greys its sound button, in its place.
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
    await clockUser().hover(button);
    const slider = within(stage()).getByRole("slider", { name: "Screen sound volume" });
    await waitFor(() => expect(slider.closest("[inert]")).toBeNull());
    expect(slider).toHaveValue("0.6");
  });

  it("greys a camera's screen sound, and its voice while the mic is off", async () => {
    const server = installFakeApi({ me: member() });
    server.streams = [
      someoneSharing("Ana Souza", 3, "camera", undefined, minutesAgo(10)),
      someoneSharing("Bruno Lima", 7, "camera", undefined, minutesAgo(5)),
    ];
    renderStage();
    await connected();
    act(() => {
      lastRoom().publishCamera("user-3");
      lastRoom().publishCamera("user-7");
    });
    await screen.findByLabelText("Ana's camera");

    expect(within(stage()).getByRole("button", { name: "No screen sound" })).toHaveAttribute("aria-disabled", "true");
    expect(within(stage()).getByRole("button", { name: "Ana's mic is off" })).toHaveAttribute("aria-disabled", "true");
    const row = await rowOf("Bruno");
    expect(within(row).getByRole("button", { name: "Bruno: No screen sound" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(within(row).getByRole("button", { name: "Bruno: Bruno's mic is off" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("plays the new big person's sound after a swap, and mutes the one that left", async () => {
    const { room, sound } = await anaAndBrunoWithSound();
    const user = clockUser();

    await user.click(within(thumbnails()).getByRole("button", { name: /^Watch Bruno/ }));

    await waitFor(() => {
      expect(sound("user-7").attached).toHaveLength(1);
      expect(room.soundPublication("user-3")!.setSubscribed).toHaveBeenLastCalledWith(false);
    });
  });
});
