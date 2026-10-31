import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DropdownSection } from "./dropdown-section.component";

describe("a dropdown's section", () => {
  it("holds what it's given", () => {
    render(<DropdownSection>Seats</DropdownSection>);
    expect(screen.getByText("Seats")).toBeInTheDocument();
  });
});
