import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ControlLabel } from "./control-label.component";

it("names the control under it", () => {
  render(<ControlLabel>Quality</ControlLabel>);
  expect(screen.getByText("Quality")).toBeInTheDocument();
});
