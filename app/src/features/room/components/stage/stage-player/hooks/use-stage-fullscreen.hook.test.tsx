import { act, fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { useStageFullscreen } from "./use-stage-fullscreen.hook";

function Player() {
  const frame = useRef<HTMLDivElement>(null);
  const { fullscreen, toggle } = useStageFullscreen(frame);
  return (
    <div ref={frame} data-testid="player">
      <button type="button" onClick={toggle}>
        {fullscreen ? "Exit" : "Enter"}
      </button>
    </div>
  );
}

/** The page's fullscreen, as the browser keeps it (setup removes it after), and the player rendered. */
function setup(allowed = true) {
  let element: Element | null = null;
  Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => element });
  const change = (el: Element | null) => {
    element = el;
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });
  };
  document.exitFullscreen = vi.fn(() => {
    change(null);
    return Promise.resolve();
  });
  render(<Player />);
  const player = screen.getByTestId("player");
  player.requestFullscreen = vi.fn(() => {
    if (!allowed) return Promise.reject(new Error("Not allowed here"));
    change(player);
    return Promise.resolve();
  });
  return { change, player };
}

describe("the player's fullscreen", () => {
  it("goes in and out with one button", () => {
    const { player } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Enter" }));
    expect(document.fullscreenElement).toBe(player);
    fireEvent.click(screen.getByRole("button", { name: "Exit" }));
    expect(document.fullscreenElement).toBeNull();
  });

  it("follows Escape, the browser's own way out", () => {
    const { change } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Enter" }));
    change(null);
    expect(screen.getByRole("button", { name: "Enter" })).toBeInTheDocument();
  });

  it("stays inline where the browser won't allow it", () => {
    setup(false);
    expect(() => fireEvent.click(screen.getByRole("button", { name: "Enter" }))).not.toThrow();
  });
});
