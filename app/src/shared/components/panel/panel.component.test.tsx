import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { PanelSection } from "@shared/components/panel-section";
import { Panel } from "./panel.component";

it("holds what it's given, as a region when asked, passing its own props on", () => {
  render(
    <Panel as="section" aria-label="The room is full" data-open>
      Number 2 in line
    </Panel>,
  );
  const panel = screen.getByRole("region", { name: "The room is full" });
  expect(panel).toHaveTextContent("Number 2 in line");
  expect(panel).toHaveAttribute("data-open");
});

it("holds its sections", () => {
  render(
    <Panel>
      <PanelSection>Activity</PanelSection>
      <PanelSection>Rafa joined</PanelSection>
    </Panel>,
  );
  expect(screen.getByText("Activity")).toBeInTheDocument();
  expect(screen.getByText("Rafa joined")).toBeInTheDocument();
});

it("can be a status that speaks its changes", () => {
  render(<Panel as="output">You're next in line.</Panel>);
  expect(screen.getByRole("status")).toHaveTextContent("You're next in line.");
});
