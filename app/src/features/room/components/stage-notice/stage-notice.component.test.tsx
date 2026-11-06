import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StageNotice } from "./stage-notice.component";

describe("a stage notice", () => {
  it("says its title and text as a status", () => {
    render(<StageNotice title="Loading Ana's screen…" text="The video starts in a moment." />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading Ana's screen…The video starts in a moment.");
  });

  it("shows a spinner only when something's on its way", () => {
    const { container, rerender } = render(<StageNotice title="Ready" text="Nothing to wait for." />);
    expect(container.querySelector("[aria-hidden='true']")).toBeNull();
    rerender(<StageNotice spinner title="Starting your share…" text="Your screen shows here in a moment." />);
    expect(container.querySelector("[aria-hidden='true']")).not.toBeNull();
  });
});
