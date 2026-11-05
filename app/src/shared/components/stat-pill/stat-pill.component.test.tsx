import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { StatPill } from "./stat-pill.component";

it("shows its lead and the number, and says what it counts", () => {
  render(<StatPill lead={<span>faces</span>} count={3} unit="watching" />);
  expect(screen.getByText("faces")).toBeInTheDocument();
  expect(screen.getByText("3")).toBeInTheDocument();
  expect(
    screen.getByText((_, el) => el?.textContent === "faces3 watching" && el.children.length === 3),
  ).toBeInTheDocument();
});
