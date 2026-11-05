import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Wordmark } from "./wordmark.component";

describe("the wordmark", () => {
  it("is one image named Xovê, drawn, not typed", () => {
    render(<Wordmark height={26} />);
    const mark = screen.getByLabelText("Xovê");
    expect(mark.tagName.toLowerCase()).toBe("svg");
    expect(mark).toHaveAttribute("height", "26");
    expect(mark.textContent).toBe("");
  });

  it("isn't a stop for the keyboard: it's a picture, not a control", () => {
    render(<Wordmark height={26} />);
    expect(screen.getByLabelText("Xovê")).not.toHaveAttribute("tabindex");
  });

  it("has the record O and a red top-right corner", () => {
    render(<Wordmark height={26} />);
    const mark = screen.getByLabelText("Xovê");
    expect(mark.querySelector("[data-dot]")).toHaveAttribute("fill", "var(--accent)");
    const red = mark.querySelectorAll("[data-corner][data-red]");
    expect([...red].map((c) => c.getAttribute("data-corner"))).toEqual(["top-right"]);
    expect(mark.querySelectorAll("[data-corner]")).toHaveLength(4);
  });
});

describe("the icon", () => {
  it("is the record O in the same corners, named Xovê", () => {
    render(<Wordmark variant="icon" height={32} />);
    const icon = screen.getByLabelText("Xovê");
    expect(icon.querySelector("[data-dot]")).toBeInTheDocument();
    expect(icon.querySelectorAll("[data-corner]")).toHaveLength(4);
    expect(icon.querySelector("[data-corner][data-red]")).toHaveAttribute("data-corner", "top-right");
  });
});
