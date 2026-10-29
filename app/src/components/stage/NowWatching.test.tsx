import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Friend, Sharer } from "@features/room/types/room-view.types";
import { NowWatching } from "./NowWatching";

const feed = (kind: "screen" | "camera", minutesAgo: number) => ({
  kind,
  startedAt: Date.now() - minutesAgo * 60_000,
  settings: { quality: "1080p" as const, mode: "smooth" as const },
});
const bruno = (camera: boolean): Sharer => ({
  person: { id: "user-7", name: "Bruno", hue: 210, online: true },
  isMe: false,
  since: Date.now() - 12 * 60_000 - 40_000,
  screen: feed("screen", 12),
  camera: camera ? feed("camera", 11) : undefined,
});

describe("now watching (spec 0104)", () => {
  it("names who is on the stage, live, what they share and for how long", () => {
    render(<NowWatching sharer={bruno(true)} />);

    expect(screen.getByRole("heading", { name: "Bruno" })).toBeInTheDocument();
    expect(screen.getByText("LIVE")).toBeInTheDocument();
    expect(screen.getByText("Screen with camera")).toBeInTheDocument();
    expect(screen.getByText("12:40")).toBeInTheDocument();
  });

  it("says Screen or Camera when that's all they share", () => {
    const { rerender } = render(<NowWatching sharer={bruno(false)} />);
    expect(screen.getByText("Screen")).toBeInTheDocument();

    rerender(<NowWatching sharer={{ ...bruno(true), screen: undefined }} />);
    expect(screen.getByText("Camera")).toBeInTheDocument();
  });

  it("says · voice while their voice is on, never for my own stream (spec 0123)", () => {
    const { rerender } = render(<NowWatching sharer={{ ...bruno(false), hasVoice: true }} />);
    expect(screen.getByText("Screen · voice")).toBeInTheDocument();
    rerender(<NowWatching sharer={{ ...bruno(false), hasVoice: true, isMe: true }} />);
    expect(screen.queryByText(/voice/)).not.toBeInTheDocument();
  });

  it("says You when I'm on the stage", () => {
    render(<NowWatching sharer={{ ...bruno(false), isMe: true }} />);
    expect(screen.getByRole("heading", { name: "You" })).toBeInTheDocument();
  });
});

const friend = (id: string, name: string): Friend => ({ id, name, hue: 100, online: true });
const people = (...names: string[]) => names.map((n, i) => friend(`user-${i + 1}`, n));

describe("now watching: who's watching (spec 0107)", () => {
  it("shows who's watching: their avatars side by side and how many", () => {
    const { container } = render(<NowWatching sharer={bruno(false)} watchers={people("Henrique", "Diego")} />);

    expect(screen.getByText("2 watching")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-watcher]")).toHaveLength(2);
  });

  it("shows up to 4 avatars, and the count covers the rest", () => {
    const { container } = render(
      <NowWatching sharer={bruno(false)} watchers={people("Ana", "Diego", "Carla", "Leo", "Rui", "Bia")} />,
    );

    expect(screen.getByText("6 watching")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-watcher]")).toHaveLength(4);
  });

  it("shows nothing about watching while nobody watches", () => {
    render(<NowWatching sharer={bruno(false)} watchers={[]} />);
    expect(screen.queryByText(/watching/)).not.toBeInTheDocument();
  });
});

describe("now watching: an empty stage (specs 0107 and 0123)", () => {
  it("says nobody's sharing, with who's here", () => {
    const { container } = render(<NowWatching sharer={null} others={people("Bruno", "Ana", "Diego")} />);

    expect(screen.getByRole("heading", { name: "Nobody is sharing yet" })).toBeInTheDocument();
    expect(screen.getByText("Bruno, Ana and Diego are here.")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-here]")).toHaveLength(3);
    expect(screen.queryByText("LIVE")).not.toBeInTheDocument();
  });

  it("says nobody else is here when I'm alone, with no avatars", () => {
    const { container } = render(<NowWatching sharer={null} others={[]} />);

    expect(screen.getByText("Nobody else is here yet.")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-here]")).toHaveLength(0);
  });

  it("shows the avatars of the first four at most", () => {
    const { container } = render(<NowWatching sharer={null} others={people("A", "B", "C", "D", "E", "F")} />);
    expect(container.querySelectorAll("[data-here]")).toHaveLength(4);
  });
});
