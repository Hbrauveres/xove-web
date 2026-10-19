import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FakeTrack } from "../../test/fakeLiveKit";
import type { Friend, MediaTrack, Sharer } from "../../types";
import { LiveFeed } from "./LiveFeed";

const video = () => new FakeTrack() as unknown as MediaTrack;
const sharer = (id: string, name: string, kinds: ("screen" | "camera")[]): Sharer => ({
  person: { id, name, hue: 100, online: true },
  isMe: false,
  since: Date.now() - 38 * 60_000 - 5_000,
  ...Object.fromEntries(
    kinds.map((kind) => [
      kind,
      {
        kind,
        startedAt: Date.now(),
        settings: { quality: "1080p", mode: "smooth" },
        remote: { video: video(), setQuality: () => {} },
      },
    ]),
  ),
  hasSound: true,
  sound: new FakeTrack() as unknown as MediaTrack,
});

const RAFA = sharer("user-2", "Rafa", ["screen"]);
const DUDA = sharer("user-3", "Duda", ["camera"]);
const watcher = (id: string): Friend => ({ id, name: id, hue: 1, online: true });

function feed(onPick = vi.fn()) {
  render(
    <LiveFeed
      others={[RAFA, DUDA]}
      liveCount={3}
      watchersOf={(id) => (id === "user-2" ? [watcher("a"), watcher("b"), watcher("c")] : [])}
      onPick={onPick}
    />,
  );
  return onPick;
}

describe("the phone's feed of live streams (spec 0158)", () => {
  it("is headed Live now with how many of the 6 are live", () => {
    feed();
    const head = screen.getByRole("heading", { name: /Live now/ });
    expect(head).toHaveTextContent("3 of 6");
  });

  it("has a card for each other stream: its picture with nothing over it, then who, LIVE, the time and who's watching", () => {
    feed();
    const cards = screen.getAllByRole("listitem");
    expect(cards).toHaveLength(2);
    const rafa = cards[0];
    expect(within(rafa).getByRole("heading", { level: 3, name: "Rafa · Screen" })).toBeInTheDocument();
    expect(within(rafa).getByText("LIVE")).toBeInTheDocument();
    expect(within(rafa).getByText("38:05")).toBeInTheDocument();
    expect(within(rafa).getByText("3 watching")).toBeInTheDocument();
    expect(within(rafa).getByLabelText("Rafa's shared screen")).toBeInTheDocument();
    expect(within(cards[1]).getByRole("heading", { name: "Duda · Camera" })).toBeInTheDocument();
    // Nothing over the picture: the LIVE badge is only in the line under it.
    expect(within(rafa).getAllByText("LIVE")).toHaveLength(1);
  });

  it("is silent: no speaker, no volume, and no sound played", () => {
    const { container } = render(
      <LiveFeed others={[RAFA]} liveCount={2} watchersOf={() => []} onPick={vi.fn()} />,
    );
    expect(screen.queryByRole("button", { name: /sound|mute|volume/i })).toBeNull();
    expect(screen.queryByRole("slider")).toBeNull();
    expect(container.querySelector("audio")).toBeNull();
  });

  it("puts a stream on the stage when its card is tapped", async () => {
    const user = userEvent.setup();
    const onPick = feed();
    await user.click(screen.getByRole("button", { name: "Watch Duda's camera" }));
    expect(onPick).toHaveBeenCalledWith("user-3");
    await user.click(screen.getByRole("heading", { name: "Rafa · Screen" }));
    expect(onPick).toHaveBeenLastCalledWith("user-2");
  });
});

describe("the phone's feed: hearing from a card (specs 0123 and 0131)", () => {
  it("has each person's two toggles beside the picture, muting without opening them", async () => {
    const onPick = vi.fn();
    const onHear = vi.fn();
    const heard = { sound: { volume: 1, muted: false }, voice: { volume: 1, muted: false } };
    render(<LiveFeed others={[RAFA]} liveCount={1} watchersOf={() => []} onPick={onPick} hearOf={() => heard} onHear={onHear} />);
    const toggle = screen.getByRole("button", { name: "Mute Rafa's screen sound" });
    // Beside the picture's own button, never inside it.
    expect(toggle.closest("button[aria-label^='Watch']")).toBeNull();
    await userEvent.setup().click(toggle);
    expect(onHear).toHaveBeenCalledWith("user-2", { ...heard, sound: { volume: 1, muted: true } });
    expect(onPick).not.toHaveBeenCalled();
  });

  it("opens a sound's slider upright over its button on a hold, in the stage's style (spec 0131, AC-5)", async () => {
    const onHear = vi.fn();
    const heard = { sound: { volume: 0.4, muted: false }, voice: { volume: 1, muted: false } };
    render(<LiveFeed others={[RAFA]} liveCount={1} watchersOf={() => []} onPick={vi.fn()} hearOf={() => heard} onHear={onHear} />);
    const button = screen.getByRole("button", { name: "Mute Rafa's screen sound" });
    const slider = screen.getByRole("slider", { name: "Rafa's screen sound volume" });
    expect(slider.closest("[inert]")).not.toBeNull();

    fireEvent.pointerDown(button, { pointerType: "touch" });
    await act(() => new Promise((r) => setTimeout(r, 550)));
    expect(slider.closest("[inert]")).toBeNull();
    expect(slider).toHaveAttribute("aria-orientation", "vertical");
    expect(slider).toHaveValue("0.4");
    fireEvent.change(slider, { target: { value: "0.7" } });
    expect(onHear).toHaveBeenLastCalledWith("user-2", { ...heard, sound: { volume: 0.7, muted: false } });
  });

  it("stacks a screen and a camera, with a swap; my own card has the swap alone (spec 0131)", async () => {
    const user = userEvent.setup();
    const heard = { sound: { volume: 1, muted: false }, voice: { volume: 1, muted: false } };
    const onSwap = vi.fn();
    const both = sharer("user-5", "Bia", ["screen", "camera"]);
    const me: Sharer = { ...sharer("me", "Henrique", ["screen", "camera"]), isMe: true };
    render(
      <LiveFeed
        others={[both, me]}
        liveCount={2}
        watchersOf={() => []}
        onPick={vi.fn()}
        hearOf={() => heard}
        onHear={vi.fn()}
        swappedOf={() => false}
        onSwap={onSwap}
      />,
    );
    const card = screen.getByRole("button", { name: "Watch Bia's screen" }).closest("li")!;
    expect(card).toHaveAttribute("data-stacked");
    await user.click(within(card).getByRole("button", { name: "Swap Bia's screen and camera" }));
    expect(onSwap).toHaveBeenCalledWith("user-5");
    expect(card).toHaveAttribute("data-swapping");

    const mine = within(screen.getByRole("group", { name: "Your stream" })).getAllByRole("button");
    expect(mine.map((b) => b.getAttribute("aria-label"))).toEqual(["Swap your screen and camera"]);
  });
});
