import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { onFakeClock } from "../../test/factories/clock.factory";
import { TIP_REST_MS } from "../ui/Tooltip";
import { ViewerBar, type Sound } from "./ViewerBar";

// Fresh handlers per render, so no test sees another's calls.
const base = () => ({ live: false, canShareScreen: true, onStart: vi.fn(), onSettings: vi.fn() });

/** The bar over Bruno's stream, with his screen's sound and voice held like the stage holds them. */
function Bruno({ voiceOff = false, noSound = false, talking = false }) {
  const [sound, setSound] = useState<Sound>({ volume: 0.8, muted: false });
  const [voice, setVoice] = useState<Sound>({ volume: 1, muted: false });
  return (
    <ViewerBar
      {...base()}
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

describe("the bar over someone else's stream (spec 0123): what I hear", () => {
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

  it("moving from one sound to the other, the one left closes and the one reached stays open (spec 0133)", () => {
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

  it("an open slider is one floating thing: my mic's tooltip closes it at once, no grace (spec 0133, #128)", () => {
    vi.useFakeTimers();
    const sound = { volume: 1, muted: false, onChange: vi.fn() };
    render(<ViewerBar {...base()} live micOn onMic={vi.fn()} sound={sound} voice={{ ...sound, name: "Bruno" }} />);
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

describe("the bar over someone else's stream (spec 0123): who's talking", () => {
  it("lights the voice while they speak; silent, it's faded; muted, never lit", async () => {
    const { rerender } = render(<Bruno />);
    const voice = () => screen.getByRole("button", { name: /Bruno's voice/ });
    expect(voice()).toHaveAttribute("data-silent");
    expect(voice()).not.toHaveAttribute("data-talking");
    rerender(<Bruno talking />);
    expect(voice()).toHaveAttribute("data-talking");
    await userEvent.setup().click(voice());
    expect(voice()).not.toHaveAttribute("data-talking");
    expect(voice()).not.toHaveAttribute("data-silent");
  });
});

describe("the bar over someone else's stream (spec 0123): me, at the right", () => {
  it("marks a heard voice to stay through the fade, and only a heard one (spec 0131, design decision 18)", async () => {
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
    render(<ViewerBar {...base()} onStart={onStart} onSettings={onSettings} />);
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
    const { rerender } = render(<ViewerBar {...base()} onStart={onStart} canShareScreen={false} />);
    await user.click(screen.getByRole("button", { name: "Go live" }));
    const screenItem = screen.getByRole("menuitem", { name: "Share your screen" });
    expect(screenItem).toHaveAttribute("aria-disabled", "true");
    expect(screenItem).toHaveAccessibleDescription("This browser can't share a screen");
    await user.click(screenItem);
    expect(onStart).not.toHaveBeenCalled();

    rerender(<ViewerBar {...base()} onStart={onStart} full />);
    expect(screen.getByRole("menuitem", { name: "Turn on your camera" })).toHaveAccessibleDescription(
      /6 streams are live/,
    );
  });

  it("shows my mic instead while I'm live, red while it's on", async () => {
    const onMic = vi.fn();
    const { rerender } = render(<ViewerBar {...base()} live micOn={false} onMic={onMic} />);
    expect(screen.queryByRole("button", { name: "Go live" })).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Share your voice" }));
    expect(onMic).toHaveBeenCalledTimes(1);
    rerender(<ViewerBar {...base()} live micOn onMic={onMic} />);
    expect(screen.getByRole("button", { name: "Mute your voice" })).toHaveAttribute("data-on");
  });

  it("is only the settings over an empty stage, in the corner (spec 0147)", () => {
    render(<ViewerBar {...base()} settingsOnly />);
    expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual(["Settings"]);
  });
});
