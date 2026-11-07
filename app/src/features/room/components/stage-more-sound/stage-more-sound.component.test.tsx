import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StageMoreSound } from "./stage-more-sound.component";

const heard = (over = {}) => ({ volume: 0.6, muted: false, onChange: vi.fn(), ...over });

describe("a sound folded into '…'", () => {
  it("mutes and unmutes with its own button, keeping its volume", async () => {
    const sound = heard();
    render(<StageMoreSound kind="voice" sound={sound} name="Bruno" />);
    await userEvent.click(screen.getByRole("button", { name: "Mute Bruno's voice" }));
    expect(sound.onChange).toHaveBeenCalledWith({ volume: 0.6, muted: true });
  });

  it("sets the volume with its slider, which also unmutes", () => {
    const sound = heard({ muted: true });
    render(<StageMoreSound kind="sound" sound={sound} />);
    fireEvent.change(screen.getByRole("slider", { name: "Screen sound volume" }), { target: { value: "0.3" } });
    expect(sound.onChange).toHaveBeenCalledWith({ volume: 0.3, muted: false });
  });

  it("has no slider when it can't be heard, its button saying why", () => {
    render(<StageMoreSound kind="sound" sound={heard({ unavailable: "No sound in this stream" })} />);
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No sound in this stream" })).toBeInTheDocument();
  });
});
