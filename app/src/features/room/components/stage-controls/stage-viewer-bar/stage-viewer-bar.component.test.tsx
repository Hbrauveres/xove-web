import { act, fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { onFakeClock } from "@testing/factories/clock.factory";
import { TIP_REST_MS } from "@shared/constants/floating.constants";
import { fullRoom } from "@features/room/utils/full-room.util";
import type { FoldKey } from "@features/room/types/fold-key.types";
import type { Sound } from "@features/room/types/sound.types";
import { StageViewerBar } from "./stage-viewer-bar.component";
import { installFakeApi, someoneSharing } from "../../../../../testing/fakeApi";
import { lastRoom } from "../../../../../testing/fakeLiveKit";
import { stubVoiceLevels } from "../../../../../testing/factories/audio.factory";
import { clockUser } from "../../../../../testing/factories/clock.factory";
import { member, stage, connected, renderStage } from "../../../../../testing/factories/stage-steps.factory";
import userEvent from "@testing-library/user-event";
// Fresh handlers per render, so no test sees another's calls.
const base = () => ({ live: false, canShareScreen: true, onStart: vi.fn(), onSettings: vi.fn() });

/** The bar over Bruno's stream, with his screen's sound and voice held like the stage holds them. */
function Bruno({
  voiceOff = false,
  noSound = false,
  talking = false,
  folded = [],
  live = false,
}: {
  voiceOff?: boolean;
  noSound?: boolean;
  talking?: boolean;
  folded?: FoldKey[];
  live?: boolean;
}) {
  const [sound, setSound] = useState<Sound>({ volume: 0.8, muted: false });
  const [voice, setVoice] = useState<Sound>({ volume: 1, muted: false });
  return (
    <StageViewerBar
      {...base()}
      live={live}
      folded={folded}
      sound={{ ...sound, onChange: setSound, unavailable: noSound ? "No sound in this stream" : undefined }}
      voice={{
        ...voice,
        onChange: setVoice,
        unavailable: voiceOff ? "Bruno's mic is off" : undefined,
        name: "Bruno",
        talking,
      }}
    />
  );
}

describe("the bar over someone else's stream: what I hear", () => {
  it("mutes one sound with a tap, crossed and pressed, leaving the other", async () => {
    const user = userEvent.setup();
    render(<Bruno />);
    await user.click(screen.getByRole("button", { name: "Mute the screen's sound" }));
    expect(screen.getByRole("button", { name: "Unmute the screen's sound" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Mute Bruno's voice" })).toHaveAttribute("aria-pressed", "false");
  });

  it("opens a sound's own slider when the mouse rests on it, and moving it unmutes", async () => {
    const user = onFakeClock();
    render(<Bruno />);
    await user.click(screen.getByRole("button", { name: "Mute Bruno's voice" }));
    const slider = screen.getByRole("slider", { name: "Bruno's voice volume" });
    expect(slider.closest("[inert]")).not.toBeNull();
    await user.hover(screen.getByRole("button", { name: "Unmute Bruno's voice" }));
    act(() => vi.advanceTimersByTime(150));
    expect(slider.closest("[inert]")).toBeNull();
    // Only its own: the screen's sound slider stays closed.
    expect(screen.getByRole("slider", { name: "Screen sound volume" }).closest("[inert]")).not.toBeNull();
    fireEvent.change(slider, { target: { value: "0.4" } });
    expect(slider).toHaveValue("0.4");
    expect(screen.getByRole("button", { name: "Mute Bruno's voice" })).toBeInTheDocument();
  });

  it("moving from one sound to the other, the one left closes and the one reached stays open", () => {
    vi.useFakeTimers();
    render(<Bruno />);
    const sound = screen.getByRole("button", { name: "Mute the screen's sound" });
    const voice = screen.getByRole("button", { name: "Mute Bruno's voice" });
    const isOpen = (name: string) => screen.getByRole("slider", { name }).closest("[inert]") === null;
    fireEvent.pointerEnter(sound.parentElement!, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(150));
    expect(isOpen("Screen sound volume")).toBe(true);

    fireEvent.pointerLeave(sound.parentElement!, { pointerType: "mouse" });
    fireEvent.pointerEnter(voice.parentElement!, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(150));
    expect(isOpen("Bruno's voice volume")).toBe(true);
    // The screen's sound's grace runs out: it mustn't close the voice's.
    act(() => vi.advanceTimersByTime(400));
    expect(isOpen("Bruno's voice volume")).toBe(true);
    expect(isOpen("Screen sound volume")).toBe(false);
  });

  it("an open slider is one floating thing: my mic's tooltip closes it at once, no grace", () => {
    vi.useFakeTimers();
    const sound = { volume: 1, muted: false, onChange: vi.fn() };
    render(<StageViewerBar {...base()} live micOn onMic={vi.fn()} sound={sound} voice={{ ...sound, name: "Bruno" }} />);
    const voice = screen.getByRole("button", { name: "Mute Bruno's voice" });
    const isOpen = () => screen.getByRole("slider", { name: "Bruno's voice volume" }).closest("[inert]") === null;
    fireEvent.pointerEnter(voice.parentElement!, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(150));
    expect(isOpen()).toBe(true);

    fireEvent.pointerLeave(voice.parentElement!, { pointerType: "mouse" });
    const mic = screen.getByRole("button", { name: "Mute your voice" });
    fireEvent.pointerEnter(mic, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(TIP_REST_MS));
    expect(document.querySelector('[role="tooltip"][data-shown]')).not.toBeNull();
    expect(isOpen()).toBe(false);
  });

  it("opens a sound's slider when Tab reaches it, and Enter mutes it", async () => {
    const user = userEvent.setup();
    render(<Bruno />);
    await user.tab();
    const button = screen.getByRole("button", { name: "Mute the screen's sound" });
    expect(button).toHaveFocus();
    expect(screen.getByRole("slider", { name: "Screen sound volume" }).closest("[inert]")).toBeNull();
    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("closes the slider after 4 s without a touch", () => {
    vi.useFakeTimers();
    render(<Bruno />);
    const button = screen.getByRole("button", { name: "Mute the screen's sound" });
    fireEvent.pointerEnter(button.parentElement!, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(120));
    const slider = screen.getByRole("slider", { name: "Screen sound volume" });
    expect(slider.closest("[inert]")).toBeNull();
    act(() => vi.advanceTimersByTime(4000));
    expect(slider.closest("[inert]")).not.toBeNull();
  });

  it("greys a sound that isn't there in its place, with no slider, saying why", async () => {
    render(<Bruno noSound voiceOff />);
    const sound = screen.getByRole("button", { name: "No sound in this stream" });
    expect(sound).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Bruno's mic is off" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    await userEvent.setup().click(sound);
    expect(sound).toHaveAttribute("aria-disabled", "true");
  });
});

describe("the bar over someone else's stream: who's talking", () => {
  it("lights the voice while they speak; silent, it's faded; muted, never lit", async () => {
    const { rerender } = render(<Bruno />);
    const voice = () => screen.getByRole("button", { name: /Bruno's voice/ });
    expect(voice()).toHaveAttribute("data-cue", "silent");
    expect(voice()).not.toHaveAttribute("data-cue", "talking");
    rerender(<Bruno talking />);
    expect(voice()).toHaveAttribute("data-cue", "talking");
    await userEvent.setup().click(voice());
    expect(voice()).not.toHaveAttribute("data-cue");
  });
});

describe("the bar over someone else's stream: me, at the right", () => {
  it("marks a heard voice to stay through the fade, and only a heard one", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Bruno />);
    const anchor = (name: string) => screen.getByRole("button", { name }).parentElement!;
    expect(anchor("Mute Bruno's voice")).toHaveAttribute("data-stays");
    expect(anchor("Mute the screen's sound")).not.toHaveAttribute("data-stays");
    await user.click(screen.getByRole("button", { name: "Mute Bruno's voice" }));
    expect(anchor("Unmute Bruno's voice")).not.toHaveAttribute("data-stays");
    rerender(<Bruno voiceOff />);
    expect(anchor("Bruno's mic is off")).not.toHaveAttribute("data-stays");
  });

  it("offers Go live while I'm not live: my screen, my camera, the settings", async () => {
    const onStart = vi.fn();
    const onSettings = vi.fn();
    const user = userEvent.setup();
    render(<StageViewerBar {...base()} onStart={onStart} onSettings={onSettings} />);
    expect(screen.queryByRole("button", { name: /voice/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Go live" }));
    await user.click(screen.getByRole("menuitem", { name: "Share your screen" }));
    expect(onStart).toHaveBeenLastCalledWith("screen");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Go live" }));
    await user.click(screen.getByRole("menuitem", { name: "Turn on your camera" }));
    expect(onStart).toHaveBeenLastCalledWith("camera");
    await user.click(screen.getByRole("button", { name: "Go live" }));
    await user.click(screen.getByRole("menuitem", { name: "Settings" }));
    expect(onSettings).toHaveBeenCalledTimes(1);
  });

  it("greys the ways to start where they can't be used, saying why", async () => {
    const onStart = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<StageViewerBar {...base()} onStart={onStart} canShareScreen={false} />);
    await user.click(screen.getByRole("button", { name: "Go live" }));
    const screenItem = screen.getByRole("menuitem", { name: "Share your screen" });
    expect(screenItem).toHaveAttribute("aria-disabled", "true");
    expect(screenItem).toHaveAccessibleDescription("This browser can't share a screen");
    await user.click(screenItem);
    expect(onStart).not.toHaveBeenCalled();

    rerender(<StageViewerBar {...base()} onStart={onStart} full={fullRoom(6)} />);
    expect(screen.getByRole("menuitem", { name: "Turn on your camera" })).toHaveAccessibleDescription(
      /6 streams are live/,
    );
  });

  it("shows my mic instead while I'm live, pressed while it's on", async () => {
    const onMic = vi.fn();
    const { rerender } = render(<StageViewerBar {...base()} live micOn={false} onMic={onMic} />);
    expect(screen.queryByRole("button", { name: "Go live" })).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Share your voice" }));
    expect(onMic).toHaveBeenCalledTimes(1);
    rerender(<StageViewerBar {...base()} live micOn onMic={onMic} />);
    expect(screen.getByRole("button", { name: "Mute your voice", pressed: true })).toBeInTheDocument();
  });

  it("while the browser holds the sound, has the unmute button in the sounds' place, and no sound", () => {
    const sound = { volume: 1, muted: false, onChange: vi.fn() };
    render(<StageViewerBar {...base()} held sound={sound} voice={{ ...sound, name: "Bruno" }} />);
    expect(screen.getByRole("button", { name: "Click to unmute" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /screen's sound/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Bruno's voice/ })).not.toBeInTheDocument();
  });

  it("is only the settings over an empty stage, in the corner", () => {
    render(<StageViewerBar {...base()} settingsOnly />);
    expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual(["Settings"]);
  });
});

describe("the bar on the floating layer (#187)", () => {
  const sliderOpen = () => screen.getByRole("slider", { name: "Screen sound volume" }).closest("[inert]") === null;
  const restOnSound = () => {
    vi.useFakeTimers();
    render(<Bruno />);
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Mute the screen's sound" }).parentElement!, {
      pointerType: "mouse",
    });
    act(() => vi.advanceTimersByTime(150));
    expect(sliderOpen()).toBe(true);
  };

  it("a press outside closes an open slider", () => {
    restOnSound();
    fireEvent.pointerDown(document.body);
    expect(sliderOpen()).toBe(false);
  });

  it("Escape closes an open slider and goes back to its button", () => {
    restOnSound();
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(sliderOpen()).toBe(false);
    expect(screen.getByRole("button", { name: "Mute the screen's sound" })).toHaveFocus();
  });

  it("a press outside closes Go live's menu; Escape closes it and goes back to its button", async () => {
    const user = userEvent.setup();
    render(<StageViewerBar {...base()} />);
    const goLive = screen.getByRole("button", { name: "Go live" });
    await user.click(goLive);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
    await user.click(goLive);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(goLive).toHaveFocus();
  });

  it("a mouse rest doesn't open a slider over the menu I opened", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.useFakeTimers();
    render(<StageViewerBar {...base()} sound={{ volume: 1, muted: false, onChange: vi.fn() }} />);
    await user.click(screen.getByRole("button", { name: "Go live" }));
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Mute the screen's sound" }).parentElement!, {
      pointerType: "mouse",
    });
    act(() => vi.advanceTimersByTime(150));
    expect(sliderOpen()).toBe(false);
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("the keyboard's focus doesn't open a slider over the menu I opened either", async () => {
    const user = userEvent.setup();
    render(<StageViewerBar {...base()} sound={{ volume: 1, muted: false, onChange: vi.fn() }} />);
    await user.click(screen.getByRole("button", { name: "Go live" }));
    await user.tab({ shift: true });
    await user.tab({ shift: true });
    expect(sliderOpen()).toBe(false);
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });
});

describe("the bar over someone else's stream, on a narrow picture", () => {
  it("shows Go live in '…' once it folded, with its rows working from there", async () => {
    const user = userEvent.setup();
    render(<Bruno folded={["go-live"]} />);
    expect(screen.queryByRole("button", { name: "Go live" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "More controls" }));
    expect(screen.getByRole("button", { name: "Share your screen" })).toBeInTheDocument();
  });

  it("moves the folded sounds into '…', where they still mute and set the volume", async () => {
    const user = userEvent.setup();
    render(<Bruno folded={["go-live", "sound", "voice"]} />);
    expect(screen.queryByRole("button", { name: "Mute Bruno's voice" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "More controls" }));
    await user.click(screen.getByRole("button", { name: "Mute Bruno's voice" }));
    expect(screen.getByRole("button", { name: "Unmute Bruno's voice" })).toBeInTheDocument();
  });

  it("keeps my mic while I'm live, with '…' beside it", () => {
    render(<Bruno live folded={["sound", "voice"]} />);
    expect(screen.getByRole("button", { name: "Share your voice" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More controls" })).toBeInTheDocument();
  });

  it("has no '…' while nothing folded", () => {
    render(<Bruno />);
    expect(screen.queryByRole("button", { name: "More controls" })).not.toBeInTheDocument();
  });
});

// The wiring: the stage over the real room session, its steps in testing/factories/stage-steps.
describe("room: the viewer's quality and volume", () => {
  beforeEach(() => {
    onFakeClock();
  });

  const watchBruno = async (options: { height?: number; withSound?: boolean; layers?: number } = {}) => {
    const server = installFakeApi({ me: member() });
    server.streams = [someoneSharing("Bruno Lima", 7)];
    const view = renderStage();
    await connected();
    await screen.findByRole("heading", { name: "Bruno" });
    act(() => {
      lastRoom().publishScreen("user-7", options);
    });
    await screen.findByLabelText("Bruno's shared screen");
    return view;
  };

  it("a tap mutes the screen's sound; resting on it opens its own slider; the volume is remembered", async () => {
    const view = await watchBruno({ withSound: true });
    const user = clockUser();
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

  it("plays the voice of the person I watch, at its own mute, and lights it while they speak", async () => {
    const voices = stubVoiceLevels();
    await watchBruno({ withSound: true });
    const user = clockUser();
    expect(within(stage()).getByRole("button", { name: "Bruno's mic is off" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    let voice!: ReturnType<ReturnType<typeof lastRoom>["publishVoice"]>;
    const sound = {} as MediaStreamTrack;
    act(() => {
      voice = lastRoom().publishVoice("user-7", sound);
    });
    const button = await within(stage()).findByRole("button", { name: "Mute Bruno's voice" });
    await waitFor(() => expect(voice.attached).toHaveLength(1));
    expect(button).not.toHaveAttribute("data-cue", "talking");
    // His voice sounds: measured where it's heard, the cue lights.
    voices.speak(sound, true);
    await waitFor(() => expect(button).toHaveAttribute("data-cue", "talking"));

    await user.click(button);
    expect((voice.attached[0] as HTMLAudioElement).muted).toBe(true);
    expect(within(stage()).getByRole("button", { name: "Unmute Bruno's voice" })).not.toHaveAttribute(
      "data-cue",
      "talking",
    );
  });

  it("closes the settings when another stream takes the stage", async () => {
    const server = installFakeApi({ me: member() });
    server.streams = [someoneSharing("Bruno Lima", 7), someoneSharing("Ana Souza", 3)];
    renderStage();
    await connected();
    await screen.findByRole("heading", { name: "Bruno" });
    const user = clockUser();
    await user.click(within(stage()).getByRole("button", { name: "Go live" }));
    await user.click(within(stage()).getByRole("menuitem", { name: "Settings" }));
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Watch Ana · screen/ }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Settings" })).not.toBeInTheDocument());
  });
});
