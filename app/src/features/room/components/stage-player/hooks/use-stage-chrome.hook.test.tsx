import { act, fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { onFakeClock } from "../../../../../testing/factories/clock.factory";
import { CHROME_IDLE_MS } from "../constants/stage-player.constants";
import { useStageChrome } from "./use-stage-chrome.hook";

/** A player 1000×500 px at the page's corner, showing whether its chrome is up, with a menu to hold it. */
function Player() {
  const frame = useRef<HTMLDivElement>(null);
  const chrome = useStageChrome(frame);
  return (
    <div ref={frame} data-testid="player" data-shown={chrome.shown} {...chrome.handlers}>
      <button type="button" onClick={() => chrome.hold("menu", true)}>
        Open menu
      </button>
      <button type="button" onClick={() => chrome.hold("menu", false)}>
        Close menu
      </button>
      <button
        type="button"
        aria-expanded="false"
        onClick={(e) =>
          e.currentTarget.setAttribute(
            "aria-expanded",
            String(e.currentTarget.getAttribute("aria-expanded") !== "true"),
          )
        }
      >
        Go live
      </button>
    </div>
  );
}

function setup() {
  onFakeClock();
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
    DOMRect.fromRect({ width: 1000, height: 500 }),
  );
  render(<Player />);
  return screen.getByTestId("player");
}
const pass = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe("the player's labels and bars", () => {
  it("show when the mouse moves, and fade 2.5 s after it rests", () => {
    const player = setup();
    expect(player).toHaveAttribute("data-shown", "false");
    fireEvent.pointerMove(player);
    expect(player).toHaveAttribute("data-shown", "true");
    pass(CHROME_IDLE_MS - 1);
    expect(player).toHaveAttribute("data-shown", "true");
    pass(1);
    expect(player).toHaveAttribute("data-shown", "false");
  });

  it("each move starts the wait again", () => {
    const player = setup();
    fireEvent.pointerMove(player);
    pass(CHROME_IDLE_MS - 500);
    fireEvent.pointerMove(player);
    pass(CHROME_IDLE_MS - 500);
    expect(player).toHaveAttribute("data-shown", "true");
  });

  it("stay while something holds them, and fade once it lets go", () => {
    const player = setup();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    pass(CHROME_IDLE_MS * 3);
    expect(player).toHaveAttribute("data-shown", "true");
    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
    pass(CHROME_IDLE_MS);
    expect(player).toHaveAttribute("data-shown", "false");
  });

  it("stay while the keyboard's focus is on a control, but not after a click", () => {
    const player = setup();
    fireEvent.keyDown(document, { key: "Tab" });
    act(() => screen.getByRole("button", { name: "Close menu" }).focus());
    fireEvent.pointerMove(player);
    pass(CHROME_IDLE_MS * 2);
    expect(player).toHaveAttribute("data-shown", "true");
    fireEvent.pointerDown(document);
    pass(CHROME_IDLE_MS);
    expect(player).toHaveAttribute("data-shown", "false");
  });

  it("hide at once when the pointer leaves, but not on a 'left' sent from inside", () => {
    const player = setup();
    fireEvent.pointerMove(player);
    fireEvent.pointerLeave(player, { clientX: 500, clientY: 250 });
    expect(player).toHaveAttribute("data-shown", "true");
    fireEvent.pointerLeave(player, { clientX: 1200, clientY: 250 });
    expect(player).toHaveAttribute("data-shown", "false");
  });

  it("stay while a control's menu is open in the player, and fade once it closes", () => {
    const player = setup();
    fireEvent.pointerMove(player);
    const goLive = screen.getByRole("button", { name: "Go live" });
    fireEvent.click(goLive);
    pass(CHROME_IDLE_MS * 3);
    expect(player).toHaveAttribute("data-shown", "true");
    fireEvent.click(goLive);
    pass(CHROME_IDLE_MS);
    expect(player).toHaveAttribute("data-shown", "false");
  });

  it("stay while the pointer rests on a control, and fade once it moves off it", () => {
    const player = setup();
    fireEvent.pointerMove(player);
    const goLive = screen.getByRole("button", { name: "Go live" });
    fireEvent.pointerOver(goLive);
    pass(CHROME_IDLE_MS * 3);
    expect(player).toHaveAttribute("data-shown", "true");
    fireEvent.pointerOut(goLive, { relatedTarget: player });
    fireEvent.pointerOver(player);
    pass(CHROME_IDLE_MS);
    expect(player).toHaveAttribute("data-shown", "false");
  });
});
