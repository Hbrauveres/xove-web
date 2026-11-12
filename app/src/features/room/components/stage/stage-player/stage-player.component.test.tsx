import { act, fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { onFakeClock } from "../../../../../testing/factories/clock.factory";
import { aSharer } from "../../../../../testing/factories/sharer.factory";
import { aStreamControls } from "../../../../../testing/factories/stream-controls.factory";
import { useHearing } from "../../../hooks/use-hearing.hook";
import { useStage } from "../../../hooks/use-stage.hook";
import type { StreamControls } from "@features/room/types/stream-controls.types";
import type { Sharer } from "../../../types/room-view.types";
import { CHROME_IDLE_MS } from "./constants/stage-player.constants";
import { StagePlayer } from "./stage-player.component";
import { installFakeApi, someoneSharing } from "../../../../../testing/fakeApi";
import { lastRoom } from "../../../../../testing/fakeLiveKit";
import { member, connected, renderStage } from "../../../../../testing/factories/stage-steps.factory";
/** The player as the stage holds it, its pick and hearing kept by the room's own hooks. */
function Player({ sharers, controls = aStreamControls() }: { sharers: Sharer[]; controls?: StreamControls }) {
  const stage = useStage(sharers);
  const hearing = useHearing(sharers, stage.big?.person.id ?? null);
  return (
    <StagePlayer
      sharers={sharers}
      controls={controls}
      stage={stage}
      hearing={hearing}
      ambilight={{ on: true, brightness: 0.9 }}
      shape={16 / 9}
      video={null}
      onVideo={vi.fn()}
      settingsPanel={<dialog open aria-label="Settings" />}
    />
  );
}

/** Bruno's screen playing in the player, on a fixed clock; the player's frame is its outermost box. */
function watchBruno() {
  onFakeClock();
  const view = render(<Player sharers={[aSharer({ hasSound: true })]} />);
  return { ...view, frame: view.container.firstElementChild as HTMLElement };
}
const pass = (ms: number) => act(() => vi.advanceTimersByTime(ms));

/** Plays the browser's fullscreen for the player's frame (jsdom has none); setup removes it after. */
function browserFullscreen(frame: HTMLElement) {
  let current: Element | null = null;
  Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => current });
  const change = (el: Element | null) => {
    current = el;
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });
  };
  frame.requestFullscreen = vi.fn(async () => change(frame));
  document.exitFullscreen = vi.fn(async () => change(null));
  return change;
}

describe("the player's labels and bars", () => {
  it("show while the mouse moves over a playing video, and fade when it stops or leaves", () => {
    const { frame } = watchBruno();
    expect(frame).toHaveAttribute("data-chrome", "hidden");
    fireEvent.pointerMove(frame);
    expect(frame).toHaveAttribute("data-chrome", "shown");
    fireEvent.pointerLeave(frame);
    expect(frame).toHaveAttribute("data-chrome", "hidden");
    fireEvent.pointerMove(frame);
    pass(CHROME_IDLE_MS);
    expect(frame).toHaveAttribute("data-chrome", "hidden");
  });

  it("show on a press on the player, its dark sides included, without a move first", () => {
    const { frame } = watchBruno();
    fireEvent.pointerDown(frame, { pointerType: "mouse" });
    expect(frame).toHaveAttribute("data-chrome", "shown");
  });

  it("ignore a 'mouse left' while the player is fullscreen: there's nothing outside it", () => {
    const { frame } = watchBruno();
    fireEvent.pointerMove(frame);
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => frame });
    fireEvent.pointerLeave(frame, { pointerType: "mouse", clientX: 0, clientY: 0 });
    expect(frame).toHaveAttribute("data-chrome", "shown");
  });

  it("ignore a 'mouse left' that comes while the pointer is still over the player", () => {
    const { frame } = watchBruno();
    fireEvent.pointerMove(frame);
    vi.spyOn(frame, "getBoundingClientRect").mockReturnValue(DOMRect.fromRect({ width: 800, height: 450 }));
    fireEvent.pointerLeave(frame, { pointerType: "mouse", clientX: 400, clientY: 200 });
    expect(frame).toHaveAttribute("data-chrome", "shown");
    // Really outside: hidden at once.
    fireEvent.pointerLeave(frame, { pointerType: "mouse", clientX: 900, clientY: 200 });
    expect(frame).toHaveAttribute("data-chrome", "hidden");
  });

  it("stay while one of the controls has the keyboard focus", () => {
    const { frame } = watchBruno();
    act(() => within(frame).getByRole("button", { name: "Fullscreen" }).focus());
    expect(frame).toHaveAttribute("data-chrome", "shown");
    pass(CHROME_IDLE_MS);
    expect(frame).toHaveAttribute("data-chrome", "shown");
  });

  it("never fade over the empty stage", () => {
    const { container } = render(<Player sharers={[]} />);
    expect(container.firstElementChild).not.toHaveAttribute("data-chrome");
  });
});

describe("the player's fullscreen", () => {
  it("enters fullscreen, and leaves it with the same button", () => {
    const { frame } = watchBruno();
    browserFullscreen(frame);
    fireEvent.click(within(frame).getByRole("button", { name: "Fullscreen" }));
    expect(frame.requestFullscreen).toHaveBeenCalledTimes(1);
    fireEvent.click(within(frame).getByRole("button", { name: "Exit fullscreen" }));
    expect(document.exitFullscreen).toHaveBeenCalled();
    expect(within(frame).getByRole("button", { name: "Fullscreen" })).toBeInTheDocument();
  });

  it("has the button with nobody live", () => {
    render(<Player sharers={[]} />);
    expect(screen.getByRole("button", { name: "Fullscreen" })).toBeInTheDocument();
  });

  it("keeps it when the only stream stops in fullscreen, so it can leave", () => {
    const { frame, rerender } = watchBruno();
    browserFullscreen(frame);
    fireEvent.click(within(frame).getByRole("button", { name: "Fullscreen" }));
    rerender(<Player sharers={[]} />);
    expect(screen.getByRole("heading", { name: "Go live" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Exit fullscreen" }));
    expect(document.exitFullscreen).toHaveBeenCalled();
  });
});

describe("the player", () => {
  it("holds the view, the controls and the settings panel, so all of it comes along in fullscreen", () => {
    const { frame } = watchBruno();
    expect(within(frame).getByLabelText("Bruno's shared screen")).toBeInTheDocument();
    expect(within(frame).getByRole("button", { name: "Mute the screen's sound" })).toBeInTheDocument();
    expect(within(frame).getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
  });

  it("puts every control on the picture's layer, and leaves the settings on the box", () => {
    const { frame } = watchBruno();
    const onPicture = (el: HTMLElement) => el.closest("[data-on-picture]");
    expect(onPicture(within(frame).getByRole("button", { name: "Fullscreen" }))).not.toBeNull();
    expect(onPicture(within(frame).getByRole("button", { name: "Mute the screen's sound" }))).not.toBeNull();
    expect(onPicture(within(frame).getByRole("dialog", { name: "Settings" }))).toBeNull();
  });
});

describe("the settings over the player", () => {
  /** The player 1600×900 at the page's corner; every button 40 px wide at x 900, every row's top at y 840. */
  function sizes() {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.tagName === "BUTTON") return DOMRect.fromRect({ x: 900, y: 850, width: 40, height: 40 });
      if (this.getAttribute("aria-label") === null && this.querySelector("button")) {
        return this.querySelector("video, h2")
          ? DOMRect.fromRect({ x: 0, y: 0, width: 1600, height: 900 })
          : DOMRect.fromRect({ x: 700, y: 840, width: 400, height: 60 });
      }
      return DOMRect.fromRect({ x: 0, y: 0, width: 1600, height: 900 });
    });
  }
  const placed = (frame: HTMLElement) => [
    frame.style.getPropertyValue("--cog-x"),
    frame.style.getPropertyValue("--above-row"),
  ];
  const open = aStreamControls({ settingsOpen: true });

  it("open over the cog in the corner with nobody live", () => {
    sizes();
    const { container } = render(<Player sharers={[]} controls={open} />);
    expect(placed(container.firstElementChild as HTMLElement)).toEqual(["920px", "70px"]);
  });

  it("open over Go live over someone else's stream", () => {
    sizes();
    const { container } = render(<Player sharers={[aSharer()]} controls={open} />);
    expect(placed(container.firstElementChild as HTMLElement)).toEqual(["920px", "70px"]);
  });

  it("open over my cog over my own stream", () => {
    sizes();
    const me = { ...aSharer({ id: "me" }), isMe: true };
    const mine = {
      ...me,
      screen: { kind: "screen" as const, startedAt: 0, settings: me.screen!.settings, local: me.screen!.remote!.video },
    };
    const { container } = render(
      <Player
        sharers={[mine]}
        controls={aStreamControls({ settingsOpen: true, mine: { screen: true, camera: false } })}
      />,
    );
    expect(placed(container.firstElementChild as HTMLElement)).toEqual(["920px", "70px"]);
  });
});

describe("the small view's fold", () => {
  it("Hide folds it into the corner button, the focus going there; the corner button opens it again", () => {
    const view = render(<Player sharers={[aSharer({ kinds: ["screen", "camera"] })]} />);
    const corner = () => screen.queryByRole("button", { name: "Show the small view" });
    expect(corner()).not.toBeInTheDocument();
    const before = within(view.container)
      .getAllByRole("button")
      .map((b) => b.getAttribute("aria-label"));

    fireEvent.click(screen.getByRole("button", { name: "Hide the small view" }));
    expect(screen.queryByRole("application", { name: /drag or use the arrow keys/ })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(corner());
    // Nothing else came or went: only the small view folded into its button.
    const after = within(view.container)
      .getAllByRole("button")
      .map((b) => b.getAttribute("aria-label"));
    expect(after).toEqual([...before.filter((l) => !/small view|Swap views/.test(l ?? "")), "Show the small view"]);

    fireEvent.click(screen.getByRole("button", { name: "Show the small view" }));
    expect(screen.getByRole("application", { name: /drag or use the arrow keys/ })).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Hide the small view" }));
  });

  it("has no corner button for someone sharing only one stream", () => {
    render(<Player sharers={[aSharer({ kinds: ["screen"] })]} />);
    expect(screen.queryByRole("button", { name: "Show the small view", hidden: true })).not.toBeInTheDocument();
  });
});

// The wiring: the stage over the real room session, its steps in testing/factories/stage-steps.
describe("room: viewers follow the sharer's changes", () => {
  beforeEach(() => {
    onFakeClock();
  });

  it("asks for Auto, at most the sharer's quality", async () => {
    const server = installFakeApi({ me: member() });
    server.streams = [someoneSharing("Bruno Lima", 7)];
    renderStage();
    await connected();
    await screen.findByRole("heading", { name: "Bruno" });
    act(() => {
      lastRoom().publishScreen("user-7");
    });
    await screen.findByLabelText("Bruno's shared screen");
    const publication = lastRoom().screenPublication("user-7")!;

    // Bruno lowers his quality; the API says so on the next poll.
    act(() => {
      server.streams[0]!.settings = { quality: "720p", mode: "smooth" };
    });

    await waitFor(() => {
      expect(publication.setVideoDimensions).toHaveBeenLastCalledWith({ width: 1280, height: 720 });
    });

    // And raises it back.
    act(() => {
      server.streams[0]!.settings = { quality: "1080p", mode: "smooth" };
    });

    await waitFor(() => {
      expect(publication.setVideoQuality).toHaveBeenLastCalledWith(2);
    });
  });
});
