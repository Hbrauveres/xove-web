import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FakeTrack } from "../../test/fakeLiveKit";
import type { MediaTrack, Sharer } from "../../types";
import { StreamsRow } from "./StreamsRow";

const sharer = (id: string, name: string, kind: "screen" | "camera"): Sharer => ({
  person: { id, name, hue: 100, online: true },
  isMe: false,
  since: Date.now(),
  [kind]: {
    kind,
    startedAt: Date.now(),
    settings: { quality: "1080p", mode: "smooth" },
    remote: { video: new FakeTrack() as unknown as MediaTrack, setQuality: () => {} },
  },
  hasSound: true,
  sound: new FakeTrack() as unknown as MediaTrack,
});
const rafa = () => sharer("user-3", "Rafa", "screen");
const duda = () => sharer("user-4", "Duda", "camera");

function row(open: boolean, onPick = vi.fn(), onOpen = vi.fn(), onClose = vi.fn()) {
  const view = render(
    <StreamsRow
      others={[rafa(), duda()]}
      liveCount={3}
      open={open}
      onOpen={onOpen}
      onClose={onClose}
      onPick={onPick}
    />,
  );
  return { ...view, onPick, onOpen, onClose };
}

describe("the streams row, sideways (spec 0160)", () => {
  it("is headed Live now with how many of the 6 are live, then a picture per stream with its name", () => {
    row(true);
    const region = screen.getByRole("region", { name: /Live now/ });
    expect(region).toHaveTextContent("3 of 6");
    expect(within(region).getByRole("button", { name: "Watch Rafa's screen" })).toHaveTextContent("Rafa");
    expect(within(region).getByRole("button", { name: "Watch Duda's camera" })).toHaveTextContent("Duda");
  });

  it("is silent: no sound controls and no sound played", () => {
    const { container } = row(true);
    expect(screen.queryByRole("slider")).toBeNull();
    expect(screen.queryByRole("button", { name: /mute|sound|volume/i })).toBeNull();
    expect(container.querySelector("audio")).toBeNull();
  });

  it("puts a stream on the stage when tapped", async () => {
    const { onPick } = row(true);
    await userEvent.setup().click(screen.getByRole("button", { name: "Watch Duda's camera" }));
    expect(onPick).toHaveBeenCalledWith("user-4");
  });

  it("is closed at first, out of reach, with a button with an arrow up that opens it", async () => {
    const { container, onOpen } = row(false);
    expect(container.querySelector("[data-open]")).toBeNull();
    expect(screen.queryByRole("button", { name: "Watch Rafa's screen" })).toBeNull();
    await userEvent.setup().click(screen.getByRole("button", { name: "Show the other streams" }));
    expect(onOpen).toHaveBeenCalled();
  });

  it("while open, the same button with an arrow down closes it, and it's never the start of a swipe", async () => {
    const { container, onClose } = row(true);
    expect(screen.queryByRole("button", { name: "Show the other streams" })).toBeNull();
    const hide = screen.getByRole("button", { name: "Hide the other streams" });
    expect(hide).toHaveAttribute("data-arrow", "down");
    await userEvent.setup().click(hide);
    expect(onClose).toHaveBeenCalled();
    expect(container.querySelector("[data-open]")).toHaveAttribute("data-no-swipe");
  });

  it("has no tab at the bottom: the button sits at the bottom left, arrow up", () => {
    row(false);
    const show = screen.getByRole("button", { name: "Show the other streams" });
    expect(show).toHaveAttribute("data-arrow", "up");
    expect(show.querySelector("svg")).not.toBeNull();
  });
});

describe("the streams row: hearing from a picture (specs 0123 and 0131)", () => {
  const heard = { sound: { volume: 1, muted: false }, voice: { volume: 1, muted: false } };
  // A finger holds the picture for half a second (spec 0131).
  async function hold(name: RegExp) {
    const li = screen.getByRole("button", { name }).closest("li")!;
    vi.useFakeTimers();
    fireEvent.pointerDown(li, { pointerType: "touch" });
    act(() => vi.advanceTimersByTime(550));
    fireEvent.pointerUp(li, { pointerType: "touch" });
    vi.useRealTimers();
    return li;
  }

  it("shows a person's buttons only after a hold, over the picture's lower part, without opening them", async () => {
    const onPick = vi.fn();
    const onHear = vi.fn();
    render(
      <StreamsRow
        others={[{ ...rafa(), hasVoice: true }]}
        liveCount={2}
        open
        onOpen={() => {}}
        onClose={() => {}}
        onPick={onPick}
        hearOf={() => heard}
        onHear={onHear}
      />,
    );
    expect(screen.queryByRole("button", { name: "Mute Rafa's voice" })).not.toBeInTheDocument();

    await hold(/^Watch Rafa/);
    const toggle = screen.getByRole("button", { name: "Mute Rafa's voice" });
    expect(toggle.closest("button[aria-label^='Watch']")).toBeNull();
    await userEvent.setup().click(toggle);
    expect(onHear).toHaveBeenCalledWith("user-3", { ...heard, voice: { volume: 1, muted: true } });
    expect(onPick).not.toHaveBeenCalled();
  });

  it("ignores only the click that ends a hold: the next tap on the picture watches it", async () => {
    const onPick = vi.fn();
    render(
      <StreamsRow
        others={[{ ...rafa(), hasVoice: true }]}
        liveCount={2}
        open
        onOpen={() => {}}
        onClose={() => {}}
        onPick={onPick}
        hearOf={() => heard}
        onHear={() => {}}
      />,
    );
    const li = await hold(/^Watch Rafa/);
    fireEvent.click(within(li).getByRole("button", { name: /^Watch Rafa/ }));
    expect(onPick).not.toHaveBeenCalled();
    await userEvent.setup().click(within(li).getByRole("button", { name: /^Watch Rafa/ }));
    expect(onPick).toHaveBeenCalledWith("user-3");
  });

  it("stacks a screen and a camera, with a swap among the held buttons (spec 0131)", async () => {
    const onSwap = vi.fn();
    const both: Sharer = { ...rafa(), camera: { ...duda().camera!, kind: "camera" } };
    render(
      <StreamsRow
        others={[both]}
        liveCount={2}
        open
        onOpen={() => {}}
        onClose={() => {}}
        onPick={() => {}}
        hearOf={() => heard}
        onHear={() => {}}
        swappedOf={() => false}
        onSwap={onSwap}
      />,
    );
    const li = await hold(/^Watch Rafa/);
    expect(li).toHaveAttribute("data-stacked");
    await userEvent.setup().click(screen.getByRole("button", { name: "Swap Rafa's screen and camera" }));
    expect(onSwap).toHaveBeenCalledWith("user-3");
    expect(li).toHaveAttribute("data-swapping");
  });

  it("lights a heard voice's picture while they speak, and not while muted (spec 0131)", () => {
    const speaking = { ...rafa(), hasVoice: true, speaking: true };
    const { rerender } = render(
      <StreamsRow
        others={[speaking]}
        liveCount={2}
        open
        onOpen={() => {}}
        onClose={() => {}}
        onPick={() => {}}
        hearOf={() => heard}
        onHear={() => {}}
      />,
    );
    const li = () => screen.getByRole("button", { name: /^Watch Rafa/ }).closest("li")!;
    expect(li()).toHaveAttribute("data-talking");
    const muted = { ...heard, voice: { volume: 1, muted: true } };
    rerender(
      <StreamsRow
        others={[speaking]}
        liveCount={2}
        open
        onOpen={() => {}}
        onClose={() => {}}
        onPick={() => {}}
        hearOf={() => muted}
        onHear={() => {}}
      />,
    );
    expect(li()).not.toHaveAttribute("data-talking");
  });
});
