import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LiveBadge } from "./live-badge.component";

describe("the LIVE badge", () => {
  it("says LIVE, wherever it sits", () => {
    render(
      <>
        <LiveBadge variant="stage" />
        <LiveBadge variant="preview" />
      </>,
    );
    expect(screen.getAllByText("LIVE")).toHaveLength(2);
  });
});
