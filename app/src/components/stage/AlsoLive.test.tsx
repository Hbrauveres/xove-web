import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { FakeTrack } from "../../test/fakeLiveKit";
import type { MediaTrack, Sharer } from "../../types";
import { AlsoLive } from "./AlsoLive";
import type { Hearing } from "./HearToggles";

const video = () => new FakeTrack() as unknown as MediaTrack;
const sharer = (id: string, name: string, kinds: ("screen" | "camera")[], extra: Partial<Sharer> = {}): Sharer => ({
  person: { id, name, hue: 100, online: true },
  isMe: false,
  since: Date.now(),
  ...Object.fromEntries(
    kinds.map((kind) => [
      kind,
      { kind, startedAt: Date.now(), settings: { quality: "1080p", mode: "smooth" }, remote: { video: video(), setQuality: () => {} } },
    ]),
  ),
  hasSound: false,
  ...extra,
});

const BRUNO = sharer("user-7", "Bruno", ["screen", "camera"], { hasSound: true, sound: video(), hasVoice: true, voice: video() });
const ANA = sharer("user-3", "Ana", ["screen"], { hasSound: true, sound: video() });
const DIEGO = sharer("user-9", "Diego", ["camera"]);
const HEARD: Hearing = { sound: { volume: 1, muted: false }, voice: { volume: 1, muted: false } };

function Harness({ others, live = 3, free = 3, onPick = vi.fn() }: { others: Sharer[]; live?: number; free?: number; onPick?: (id: string) => void }) {
  const [hearing, setHearing] = useState<Record<string, Hearing>>({});
  return (
    <AlsoLive
      others={others}
      liveCount={live}
      free={free}
      onPick={onPick}
      hearOf={(id) => hearing[id] ?? HEARD}
      onHear={(id, h) => setHearing((was) => ({ ...was, [id]: h }))}
    />
  );
}

const preview = (name: RegExp) => screen.getByRole("button", { name });

describe("also live (specs 0104 and 0123)", () => {
  it("shows my own stream from my browser, as You, with no toggles", () => {
    const local = video();
    const me: Sharer = {
      person: { id: "me", name: "Henrique", hue: 36, online: true },
      isMe: true,
      since: Date.now(),
      screen: { kind: "screen", startedAt: Date.now(), settings: { quality: "1080p", mode: "smooth" }, local },
      hasSound: true,
    };
    render(<Harness others={[me]} />);

    expect(preview(/Watch your screen/)).toHaveTextContent("You · screen");
    expect((local as unknown as FakeTrack).attached).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /Mute/ })).not.toBeInTheDocument();
  });

  it("says Loading until someone's video arrives", () => {
    const waiting: Sharer = { ...ANA, screen: { ...ANA.screen!, remote: undefined } };
    render(<Harness others={[waiting]} />);
    expect(preview(/Watch Ana's screen/)).toHaveTextContent("Loading…");
  });

  it("puts a preview on the stage when clicked", async () => {
    const onPick = vi.fn();
    render(<Harness others={[ANA]} onPick={onPick} />);
    await userEvent.setup().click(preview(/Watch Ana's screen/));
    expect(onPick).toHaveBeenCalledWith("user-3");
  });

  it("plays no preview's sound or voice: previews are silent", () => {
    render(<Harness others={[BRUNO]} />);
    expect((BRUNO.sound as unknown as FakeTrack).attached).toHaveLength(0);
    expect((BRUNO.voice as unknown as FakeTrack).attached).toHaveLength(0);
  });

  it("mutes a person's sound and voice from their preview, without opening them", async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    render(<Harness others={[BRUNO]} onPick={onPick} />);

    const sound = screen.getByRole("button", { name: "Mute Bruno's screen sound" });
    const voice = screen.getByRole("button", { name: "Mute Bruno's voice" });
    await user.click(sound);
    expect(sound).toHaveAttribute("aria-pressed", "true");
    expect(voice).toHaveAttribute("aria-pressed", "false");
    await user.click(voice);
    expect(voice).toHaveAttribute("aria-pressed", "true");
    expect(onPick).not.toHaveBeenCalled();
  });

  it("greys a sound that isn't there, in its place, saying why", () => {
    render(<Harness others={[DIEGO]} />);
    expect(screen.getByRole("button", { name: "Diego: No screen sound" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Diego: Diego's mic is off" })).toHaveAttribute("aria-disabled", "true");
  });

  it("shows the seats as six dots, red for each stream live, beside the previews (spec 0123)", () => {
    const { container } = render(<Harness others={[ANA, DIEGO]} live={3} free={3} />);
    const box = container.querySelector("[data-free]") as HTMLElement;
    expect(box).toHaveAccessibleName("3 of 6 live, 3 seats open");
    expect(box.querySelectorAll("i")).toHaveLength(6);
    expect(box.querySelectorAll("i[data-on]")).toHaveLength(3);
    // The box stays put while the previews scroll: it's not one of them.
    expect(within(screen.getByRole("list", { name: "Other streams" })).queryByText(/seat/)).not.toBeInTheDocument();
  });

  it("has no box at all when all 6 seats are taken", () => {
    const { container } = render(<Harness others={[ANA]} live={6} free={0} />);
    expect(container.querySelector("[data-free]")).toBeNull();
  });
});
