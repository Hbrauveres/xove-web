import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { onFakeClock } from "../../testing/factories/clock.factory";
import { aSharer } from "../../testing/factories/sharer.factory";
import { aTrack } from "../../testing/factories/track.factory";
import type { FakeTrack } from "../../testing/fakeLiveKit";
import type { Sharer } from "@features/room/types/room-view.types";
import { AlsoLive } from "./AlsoLive";
import type { Hearing } from "./HearToggles";

const bruno = () =>
  aSharer({
    id: "user-7",
    name: "Bruno",
    kinds: ["screen", "camera"],
    hasSound: true,
    sound: aTrack(),
    hasVoice: true,
    voice: aTrack(),
  });
const ana = () => aSharer({ id: "user-3", name: "Ana", kinds: ["screen"], hasSound: true, sound: aTrack() });
const diego = () => aSharer({ id: "user-9", name: "Diego", kinds: ["camera"] });
const HEARD: Hearing = { sound: { volume: 1, muted: false }, voice: { volume: 1, muted: false } };

function Harness({
  others,
  live = 3,
  free = 3,
  onPick = vi.fn(),
  heard = HEARD,
}: {
  others: Sharer[];
  live?: number;
  free?: number;
  onPick?: (id: string) => void;
  heard?: Hearing;
}) {
  const [hearing, setHearing] = useState<Record<string, Hearing>>({});
  const [swapped, setSwapped] = useState<Record<string, boolean>>({});
  return (
    <AlsoLive
      others={others}
      liveCount={live}
      free={free}
      onPick={onPick}
      hearOf={(id) => hearing[id] ?? heard}
      onHear={(id, h) => setHearing((was) => ({ ...was, [id]: h }))}
      swappedOf={(id) => Boolean(swapped[id])}
      onSwap={(id) => setSwapped((was) => ({ ...was, [id]: !was[id] }))}
    />
  );
}

const preview = (name: RegExp) => screen.getByRole("button", { name });
const item = (name: RegExp) => preview(name).closest("li") as HTMLElement;
// Pointing at a preview opens its row (spec 0131).
async function rowOf(name: string, user = onFakeClock()) {
  await user.hover(screen.getByRole("button", { name: (n) => n.startsWith(`Watch ${name}`) }));
  return screen.findByRole("group", { name: `${name}'s sounds` });
}

describe("also live (specs 0104 and 0123)", () => {
  it("shows my own stream from my browser, as You, with no toggles", async () => {
    const local = aTrack();
    const me: Sharer = {
      person: { id: "user-99", name: "Henrique", hue: 210, online: true },
      isMe: true,
      since: Date.now(),
      screen: { kind: "screen", startedAt: Date.now(), settings: { quality: "1080p", mode: "smooth" }, local },
      hasSound: true,
    };
    render(<Harness others={[me]} />);

    expect(preview(/Watch your screen/)).toHaveTextContent("You · screen");
    expect((local as unknown as FakeTrack).attached).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /Mute/ })).not.toBeInTheDocument();
    // Only a screen: pointing at it opens nothing.
    const user = onFakeClock();
    await user.hover(preview(/Watch your screen/));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("gives my own preview its swap alone when I share a screen and a camera (spec 0131)", async () => {
    const user = onFakeClock();
    const local = aTrack();
    const feed = { startedAt: Date.now(), settings: { quality: "1080p" as const, mode: "smooth" as const }, local };
    const me: Sharer = {
      person: { id: "user-99", name: "Henrique", hue: 210, online: true },
      isMe: true,
      since: Date.now(),
      screen: { kind: "screen", ...feed },
      camera: { kind: "camera", ...feed },
      hasSound: true,
    };
    render(<Harness others={[me]} />);

    await user.hover(preview(/^Watch your screen/));
    const row = await screen.findByRole("group", { name: "Your stream" });
    expect(
      within(row)
        .getAllByRole("button")
        .map((b) => b.getAttribute("aria-label")),
    ).toEqual(["Swap your screen and camera"]);
    await user.click(within(row).getByRole("button"));
    expect(preview(/^Watch your camera/)).toBeInTheDocument();
  });

  it("says Loading until someone's video arrives", () => {
    const one = ana();
    const waiting: Sharer = { ...one, screen: { ...one.screen!, remote: undefined } };
    render(<Harness others={[waiting]} />);
    expect(preview(/Watch Ana's screen/)).toHaveTextContent("Loading…");
  });

  it("puts a preview on the stage when clicked", async () => {
    const onPick = vi.fn();
    render(<Harness others={[ana()]} onPick={onPick} />);
    await onFakeClock().click(preview(/Watch Ana's screen/));
    expect(onPick).toHaveBeenCalledWith("user-3");
  });

  it("plays nothing itself: the stage plays what I hear", () => {
    const him = bruno();
    render(<Harness others={[him]} />);
    expect((him.sound as unknown as FakeTrack).attached).toHaveLength(0);
    expect((him.voice as unknown as FakeTrack).attached).toHaveLength(0);
  });

  it("has no buttons on the picture; pointing at it opens its row, outside it (spec 0131)", async () => {
    render(<Harness others={[bruno()]} />);
    expect(within(item(/^Watch Bruno/)).queryByRole("button", { name: /Mute|Swap/ })).not.toBeInTheDocument();

    const row = await rowOf("Bruno");
    expect(
      within(row)
        .getAllByRole("button")
        .map((b) => b.getAttribute("aria-label")),
    ).toEqual(["Mute Bruno's voice", "Mute Bruno's screen sound", "Swap Bruno's screen and camera"]);
    expect(item(/^Watch Bruno/).contains(row)).toBe(false);
    expect(item(/^Watch Bruno/)).toHaveAttribute("data-open");
  });

  it("turns a person's sound and voice on and off from their row, without opening them", async () => {
    const onPick = vi.fn();
    const user = onFakeClock();
    render(<Harness others={[bruno()]} onPick={onPick} />);
    const row = await rowOf("Bruno", user);

    const sound = within(row).getByRole("button", { name: "Mute Bruno's screen sound" });
    const voice = within(row).getByRole("button", { name: "Mute Bruno's voice" });
    await user.click(sound);
    expect(sound).toHaveAttribute("aria-pressed", "true");
    expect(voice).toHaveAttribute("aria-pressed", "false");
    await user.click(voice);
    expect(voice).toHaveAttribute("aria-pressed", "true");
    expect(onPick).not.toHaveBeenCalled();
  });

  it("keeps the row while the pointer moves into it, and closes it a moment after it leaves both", async () => {
    const user = onFakeClock();
    render(<Harness others={[bruno()]} />);
    const row = await rowOf("Bruno", user);

    await user.unhover(preview(/^Watch Bruno/));
    await user.hover(row);
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByRole("group", { name: "Bruno's sounds" })).toBeInTheDocument();

    await user.unhover(row);
    await waitFor(() => expect(item(/^Watch Bruno/)).not.toHaveAttribute("data-open"));
  });

  it("opens a sound's slider on a rest, one at a time; moving it turns that sound on (spec 0131)", async () => {
    const user = onFakeClock();
    const off: Hearing = { sound: { volume: 0.5, muted: true }, voice: { volume: 0.5, muted: true } };
    render(<Harness others={[bruno()]} heard={off} />);
    const row = await rowOf("Bruno", user);

    await user.hover(within(row).getByRole("button", { name: "Unmute Bruno's voice" }));
    const voiceBar = await within(row).findByRole("slider", { name: "Bruno's voice volume" });
    expect(within(row).getByRole("button", { name: "Unmute Bruno's voice" })).toHaveAttribute("data-active");

    // Resting on the sound: the slider now sets the sound; the voice's shrinks away.
    await user.hover(within(row).getByRole("button", { name: "Unmute Bruno's screen sound" }));
    const soundBar = await within(row).findByRole("slider", { name: "Bruno's screen sound volume" });
    expect(voiceBar).not.toBeInTheDocument();
    expect(row.querySelector("[data-leaving]")).not.toBeNull();

    fireEvent.change(soundBar, { target: { value: "0.3" } });
    expect(within(row).getByRole("button", { name: "Mute Bruno's screen sound" })).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "Unmute Bruno's voice" })).toBeInTheDocument();
  });

  it("hands the row over when the pointer moves to another preview: one rolls back, the other unrolls", async () => {
    const user = onFakeClock();
    render(<Harness others={[bruno(), ana()]} />);
    await rowOf("Bruno", user);
    await rowOf("Ana", user);

    expect(screen.getByRole("group", { name: "Ana's sounds" }).closest("[data-leaving]")).toBeNull();
    expect(screen.getByRole("group", { name: "Bruno's sounds" }).closest("[data-leaving]")).not.toBeNull();
    expect(item(/^Watch Ana/)).toHaveAttribute("data-open");
    expect(item(/^Watch Bruno/)).not.toHaveAttribute("data-open");
  });

  it("reaches a preview's row by keyboard: Tab goes in and on to the next preview, Escape back (spec 0131)", async () => {
    const user = onFakeClock();
    render(<Harness others={[bruno(), ana()]} />);

    await user.tab();
    expect(preview(/^Watch Bruno/)).toHaveFocus();
    const row = await screen.findByRole("group", { name: "Bruno's sounds" });
    await user.tab();
    expect(within(row).getByRole("button", { name: "Mute Bruno's voice" })).toHaveFocus();
    // A sound focused by keyboard opens its slider, as on the stage.
    expect(await within(row).findByRole("slider", { name: "Bruno's voice volume" })).toBeInTheDocument();
    await user.tab({ shift: true });
    expect(preview(/^Watch Bruno/)).toHaveFocus();

    // Through the row and out: the next preview.
    await user.tab();
    for (let i = 0; i < 6 && !preview(/^Watch Ana/).matches(":focus"); i++) await user.tab();
    expect(preview(/^Watch Ana/)).toHaveFocus();
    expect(await screen.findByRole("group", { name: "Ana's sounds" })).toBeInTheDocument();

    await user.tab();
    await user.keyboard("{Escape}");
    expect(preview(/^Watch Ana/)).toHaveFocus();
  });

  it("greys a sound that isn't there, in its place, saying why", async () => {
    render(<Harness others={[diego()]} />);
    const row = await rowOf("Diego");
    expect(within(row).getByRole("button", { name: "Diego: No screen sound" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(within(row).getByRole("button", { name: "Diego: Diego's mic is off" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("stacks a screen and a camera: the other picture behind, and the swap trades them (spec 0131, AC-3)", async () => {
    const user = onFakeClock();
    render(<Harness others={[bruno()]} />);
    expect(item(/^Watch Bruno's screen/)).toHaveAttribute("data-stacked");
    expect(item(/^Watch Bruno's screen/).querySelector(':scope > span[aria-hidden="true"] video')).not.toBeNull();

    const row = await rowOf("Bruno", user);
    await user.click(within(row).getByRole("button", { name: "Swap Bruno's screen and camera" }));
    expect(preview(/^Watch Bruno's camera/)).toBeInTheDocument();
    expect(item(/^Watch Bruno's camera/)).toHaveAttribute("data-swapping");
  });

  it("lights a heard preview's picture while they speak; open, its voice button instead; muted, nothing (spec 0131, AC-4)", async () => {
    const user = onFakeClock();
    const speaking = { ...bruno(), speaking: true };
    const { rerender } = render(<Harness others={[speaking]} />);
    expect(item(/^Watch Bruno/)).toHaveAttribute("data-talking");

    const row = await rowOf("Bruno", user);
    expect(item(/^Watch Bruno/)).not.toHaveAttribute("data-talking");
    expect(within(row).getByRole("button", { name: "Mute Bruno's voice" })).toHaveAttribute("data-talking");

    const off: Hearing = { ...HEARD, voice: { volume: 1, muted: true } };
    rerender(<Harness others={[speaking]} heard={off} />);
    await user.unhover(preview(/^Watch Bruno/));
    await waitFor(() => expect(item(/^Watch Bruno/)).not.toHaveAttribute("data-open"));
    expect(item(/^Watch Bruno/)).not.toHaveAttribute("data-talking");
  });

  it("shows the seats as six little screens, red for each stream live, beside the previews (specs 0123 and 0136)", () => {
    const { container } = render(<Harness others={[ana(), diego()]} live={3} free={3} />);
    const box = container.querySelector("[data-free]") as HTMLElement;
    expect(box).toHaveAccessibleName("3 of 6 live, 3 seats open");
    expect(box.querySelectorAll("i")).toHaveLength(6);
    expect(box.querySelectorAll("i[data-on]")).toHaveLength(3);
    // The box stays put while the previews scroll: it's not one of them.
    expect(within(screen.getByRole("list", { name: "Other streams" })).queryByText(/seat/)).not.toBeInTheDocument();
  });

  it("has no box at all when all 6 seats are taken", () => {
    const { container } = render(<Harness others={[ana()]} live={6} free={0} />);
    expect(container.querySelector("[data-free]")).toBeNull();
  });
});
