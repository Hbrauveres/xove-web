import { render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import type { StageSettingsInput } from "../types/stage-settings.types";
import { SettingsAnchorContext, useSettingsAnchor } from "../../../../hooks/use-settings-anchor.hook";
import { useStageSettings } from "./use-stage-settings.hook";

type Given = Omit<StageSettingsInput, "frame">;

/** The controls on the stage: a row of buttons and its cog, handed to the stage as the real ones are. */
function Controls({ onToggle }: { onToggle: () => void }) {
  const anchor = useSettingsAnchor();
  return (
    <div ref={anchor?.row}>
      <button type="button" ref={anchor?.cog} onClick={onToggle}>
        Settings
      </button>
    </div>
  );
}

/** A player holding the controls, the settings open or not. */
function Player(props: Given) {
  const frame = useRef<HTMLDivElement>(null);
  const { anchor, toggle } = useStageSettings({ ...props, frame });
  return (
    <div ref={frame} data-testid="player">
      <SettingsAnchorContext value={anchor}>
        <Controls onToggle={toggle} />
      </SettingsAnchorContext>
    </div>
  );
}

/** The player at 0,0 1600×900; the row 60 px tall at its bottom; the cog 40 px wide at x 900. */
function sizes() {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    if (this.dataset.testid === "player") return DOMRect.fromRect({ x: 0, y: 0, width: 1600, height: 900 });
    if (this.tagName === "BUTTON") return DOMRect.fromRect({ x: 900, y: 850, width: 40, height: 40 });
    return DOMRect.fromRect({ x: 700, y: 840, width: 400, height: 60 });
  });
}

const given = (over: Partial<Given> = {}): Given => ({
  open: false,
  onToggle: vi.fn(),
  bigId: "ana",
  hold: vi.fn(),
  ...over,
});

describe("the settings over the stage", () => {
  it("open centred on the cog, just above the row of buttons", () => {
    sizes();
    render(<Player {...given({ open: true })} />);
    const player = screen.getByTestId("player");
    expect(player.style.getPropertyValue("--cog-x")).toBe("920px");
    expect(player.style.getPropertyValue("--above-row")).toBe("70px");
  });

  it("hold the controls up from the cog's click, and let go once closed", () => {
    const props = given();
    const { rerender } = render(<Player {...props} />);
    screen.getByRole("button", { name: "Settings" }).click();
    expect(props.onToggle).toHaveBeenCalledTimes(1);
    expect(props.hold).toHaveBeenLastCalledWith("settings", true);
    rerender(<Player {...props} open />);
    rerender(<Player {...props} open={false} />);
    expect(props.hold).toHaveBeenLastCalledWith("settings", false);
  });

  it("close when another stream takes the stage", () => {
    const props = given({ open: true });
    const { rerender } = render(<Player {...props} />);
    expect(props.onToggle).not.toHaveBeenCalled();
    rerender(<Player {...props} bigId="bruno" />);
    expect(props.onToggle).toHaveBeenCalledTimes(1);
  });
});
