import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { SectionHeading } from "./section-heading.component";

it("is a heading named by its words, its count in a chip, red when it needs you", () => {
  render(
    <SectionHeading count={2} attention>
      Waiting for access
    </SectionHeading>,
  );
  expect(screen.getByRole("heading", { level: 2, name: /Waiting for access/ })).toBeInTheDocument();
  expect(screen.getByText("2")).toHaveAttribute("data-tone", "attention");
});

it("has no chip without a count", () => {
  render(<SectionHeading>Members</SectionHeading>);
  expect(screen.getByRole("heading", { name: "Members" }).children).toHaveLength(0);
});
