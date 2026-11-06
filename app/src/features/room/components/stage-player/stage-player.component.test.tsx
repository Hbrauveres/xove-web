import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { onFakeClock } from "../../../../testing/factories/clock.factory";
import { aSharer } from "../../../../testing/factories/sharer.factory";
import { aStreamControls } from "../../../../testing/factories/stream-controls.factory";
import { useHearing } from "../../hooks/use-hearing.hook";
import { useStage } from "../../hooks/use-stage.hook";
import type { Sharer } from "../../types/room-view.types";
import { CHROME_IDLE_MS } from "./constants/stage-player.constants";
import { StagePlayer } from "./stage-player.component";

/** The player as the stage holds it, its pick and hearing kept by the room's own hooks. */
function Player({ sharers }: { sharers: Sharer[] }) {
  const stage = useStage(sharers);
  const hearing = useHearing(sharers, stage.big?.person.id ?? null);
  return (
    <StagePlayer
      sharers={sharers}
      controls={aStreamControls()}
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
});
