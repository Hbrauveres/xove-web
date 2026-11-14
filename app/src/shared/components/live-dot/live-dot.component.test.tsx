import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LiveDot } from "./live-dot.component";

describe("the live dot", () => {
  it("is only seen: hidden from assistive tech, which hears what's live in words", () => {
    const { container } = render(<LiveDot size="s" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
