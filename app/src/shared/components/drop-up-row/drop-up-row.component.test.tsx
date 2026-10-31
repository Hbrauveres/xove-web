import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DropUpRow } from "./drop-up-row.component";

describe("a drop-up's row", () => {
  it("holds what it's given", () => {
    render(<DropUpRow>Your screen</DropUpRow>);
    expect(screen.getByText("Your screen")).toBeInTheDocument();
  });
});
