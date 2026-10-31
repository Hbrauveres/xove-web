import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Cue } from "./cue.component";

describe("the cue", () => {
  it("shows only when asked, hidden from screen readers", () => {
    const { container, rerender } = render(<Cue />);
    expect(container.querySelector("[data-cue]")).toBeNull();
    rerender(<Cue request={1} />);
    expect(container.querySelector("[data-cue]")).toHaveAttribute("aria-hidden", "true");
  });

  it("is drawn anew for a new request, so its pulses start over", () => {
    const { container, rerender } = render(<Cue request={1} />);
    const first = container.querySelector("[data-cue]");
    rerender(<Cue request={2} />);
    expect(container.querySelector("[data-cue]")).not.toBe(first);
  });
});
