import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { StageScreenSource } from "./stage-screen-source.component";

it("says what my screen share shows, or just my screen while it's unknown", () => {
  const { rerender } = render(<StageScreenSource surface="monitor" />);
  expect(screen.getByText("Your whole screen")).toBeInTheDocument();
  rerender(<StageScreenSource />);
  expect(screen.getByText("Your screen")).toBeInTheDocument();
});
