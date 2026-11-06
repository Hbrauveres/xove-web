import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeaderSeats } from "./header-seats.component";

describe("the room's seats", () => {
  it("says how many are taken and free, with a bar for the share taken", () => {
    render(<HeaderSeats seats={{ total: 20, taken: 4, waiting: 0 }} />);
    expect(screen.getByText((_, el) => el?.textContent === "4 of 20 · 16 free")).toBeInTheDocument();
    const bar = screen.getByRole("progressbar", { name: "Seats taken" });
    expect(bar).toHaveAttribute("value", "4");
    expect(bar).toHaveAttribute("max", "20");
  });

  it("never counts fewer than none free", () => {
    render(<HeaderSeats seats={{ total: 3, taken: 4, waiting: 1 }} />);
    expect(screen.getByText((_, el) => el?.textContent === "4 of 3 · 0 free")).toBeInTheDocument();
  });
});
