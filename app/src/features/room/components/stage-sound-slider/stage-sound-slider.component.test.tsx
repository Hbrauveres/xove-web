import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StageSoundSlider } from "./stage-sound-slider.component";
describe("a sound's slider in the row", () => {
  it("sets the volume", () => {
    const onVolume = vi.fn();
    render(
      <StageSoundSlider
        kind="voice"
        sound={{ volume: 1, muted: false }}
        label="Ana's voice volume"
        onVolume={onVolume}
      />,
    );
    fireEvent.change(screen.getByRole("slider", { name: "Ana's voice volume" }), { target: { value: "0.4" } });
    expect(onVolume).toHaveBeenCalledWith(0.4);
  });

  it("leaving, is hidden from screen readers and out of the tab order", () => {
    const { container } = render(
      <StageSoundSlider kind="sound" sound={{ volume: 0.5, muted: false }} phase="leaving" />,
    );
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    expect(container.querySelector("input")).toHaveAttribute("tabindex", "-1");
  });
});
