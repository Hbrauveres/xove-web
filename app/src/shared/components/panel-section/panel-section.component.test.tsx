import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PanelSection } from "./panel-section.component";

describe("a panel's section", () => {
  it("holds what it's given", () => {
    render(<PanelSection>Seats</PanelSection>);
    expect(screen.getByText("Seats")).toBeInTheDocument();
  });
});
