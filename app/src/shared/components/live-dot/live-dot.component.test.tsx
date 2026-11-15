import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LiveDot } from "./live-dot.component";
import styles from "./live-dot.component.module.css";

describe("the live dot", () => {
  it("is only seen: hidden from assistive tech, which hears what's live in words", () => {
    const { container } = render(<LiveDot size="s" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("pulsing", () => {
  it("pulses only when asked: something waiting, not something live", () => {
    const { container } = render(
      <>
        <LiveDot size="m" pulse />
        <LiveDot size="m" />
      </>,
    );
    const [waiting, live] = [...container.children];
    expect(waiting?.className.split(" ")).toContain(styles.pulse);
    expect(live?.className.split(" ")).not.toContain(styles.pulse);
  });
});
