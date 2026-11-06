import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StagePlaces } from "./stage-places.component";

describe("the places", () => {
  it("draws one little screen per place, red for each stream live, and says how many", () => {
    render(<StagePlaces liveCount={1} places={4} free={3} />);
    const box = screen.getByRole("figure", { name: "1 of 4 live, 3 seats open" });
    expect(box.querySelectorAll("i")).toHaveLength(4);
    expect(box.querySelectorAll("i[data-on]")).toHaveLength(1);
  });

  it("is gone when every place is taken", () => {
    render(<StagePlaces liveCount={6} places={6} free={0} />);
    expect(screen.queryByRole("figure")).not.toBeInTheDocument();
  });
});
