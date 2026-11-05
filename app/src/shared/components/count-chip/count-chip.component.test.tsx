import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { CountChip } from "./count-chip.component";

it("shows its number, neutral unless it needs you", () => {
  render(
    <>
      <CountChip count={12} />
      <CountChip count={2} tone="attention" />
    </>,
  );
  expect(screen.getByText("12")).toHaveAttribute("data-tone", "neutral");
  expect(screen.getByText("2")).toHaveAttribute("data-tone", "attention");
});
