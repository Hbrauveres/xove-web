import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Header } from "./header.component";

describe("the room's header", () => {
  it("is a banner with the logo, the middle and the right", () => {
    render(<Header middle={<button type="button">Activity</button>} right={<button type="button">Me</button>} />);
    const header = screen.getByRole("banner");
    expect(within(header).getByLabelText("Xovê")).toBeInTheDocument();
    expect(
      within(header)
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual(["Activity", "Me"]);
  });
});
