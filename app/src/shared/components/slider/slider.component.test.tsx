import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Slider } from "./slider.component";

describe("Slider, the white one", () => {
  it("is a plain range input, with every prop passed through", () => {
    const onChange = vi.fn();
    render(<Slider aria-label="Volume" className="mine" min={0} max={1} step={0.05} value={0.5} onChange={onChange} />);
    const slider = screen.getByRole("slider", { name: "Volume" });
    expect(slider).toHaveAttribute("type", "range");
    expect(slider).toHaveAttribute("step", "0.05");
    expect(slider).toHaveValue("0.5");
    expect(slider.className).toContain("mine");
    fireEvent.change(slider, { target: { value: "0.7" } });
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("tells its stylesheet how far the white fill goes, from min to max", () => {
    const fill = (value: number, min = 0.2, max = 1) => {
      const { unmount } = render(<Slider aria-label="r" min={min} max={max} value={value} onChange={() => {}} />);
      const at = screen.getByRole("slider").style.getPropertyValue("--fill");
      unmount();
      return at;
    };
    expect(fill(0.2)).toBe("0%");
    expect(fill(0.6)).toBe("50%");
    expect(fill(1)).toBe("100%");
    // Out of range values stay on the track.
    expect(fill(2)).toBe("100%");
  });

  it("fills nothing, rather than breaking the track, without a value", () => {
    render(<Slider aria-label="r" min={0} max={1} defaultValue={0.5} />);
    expect(screen.getByRole("slider").style.getPropertyValue("--fill")).toBe("0%");
  });

  it("as a threshold, draws the live level in its track, green while it's over the line (sent)", () => {
    const at = (level: number, sent: boolean) => {
      const { unmount } = render(
        <Slider
          variant="threshold"
          aria-label="Mic sensitivity"
          level={level}
          sent={sent}
          value={0.2}
          onChange={() => {}}
        />,
      );
      const s = screen.getByRole("slider", { name: "Mic sensitivity" });
      const seen = [s.style.getPropertyValue("--level"), s.hasAttribute("data-sent")];
      unmount();
      return seen;
    };
    expect(at(0.5, true)).toEqual(["50%", true]);
    expect(at(0.1, false)).toEqual(["10%", false]);
  });
});
