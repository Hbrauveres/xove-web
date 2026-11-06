import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { onFakeClock } from "@testing/factories/clock.factory";
import { OUT_MS } from "./constants/stage-preview-tray-row.constants";
import { StagePreviewTrayRow } from "./stage-preview-tray-row.component";

const setup = (leaving = false) => {
  document.body.innerHTML = "";
  const anchor = document.createElement("li");
  anchor.innerHTML = "<button>Watch Ana · screen</button>";
  document.body.append(anchor);
  const handlers = { onGone: vi.fn(), onEnter: vi.fn(), onLeave: vi.fn(), onElement: vi.fn() };
  render(
    <StagePreviewTrayRow layer={{ open: { id: "user-3", anchor, picture: anchor }, leaving }} {...handlers}>
      <button>Mute Ana's voice</button>
    </StagePreviewTrayRow>,
  );
  return handlers;
};

describe("a preview's row on the tray", () => {
  it("hands its element to the tray, and keeps the row while the pointer is on it", () => {
    const { onElement, onEnter } = setup();
    expect(onElement).toHaveBeenCalledWith(expect.any(HTMLElement));
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Mute Ana's voice" }).parentElement as HTMLElement);
    expect(onEnter).toHaveBeenCalled();
  });

  it("Shift+Tab from its first button goes back to its preview", () => {
    setup();
    const mute = screen.getByRole("button", { name: "Mute Ana's voice" });
    mute.focus();
    fireEvent.keyDown(mute, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Watch Ana · screen" }));
  });

  it("rolling back, is gone once its time is up", () => {
    onFakeClock();
    const { onGone, onElement } = setup(true);
    expect(onElement).not.toHaveBeenCalled();
    vi.advanceTimersByTime(OUT_MS);
    expect(onGone).toHaveBeenCalledWith("user-3");
  });
});
