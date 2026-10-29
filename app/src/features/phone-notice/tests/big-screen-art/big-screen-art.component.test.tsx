import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BigScreenArt } from "../../big-screen-art/big-screen-art.component";

describe("the big screen drawing", () => {
  it("is decoration: hidden from screen readers, so the words say it all", () => {
    const { container } = render(<BigScreenArt />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
