import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { StageVideoFrame } from "./stage-video-frame.component";

it("frames what it's given, with its holder's place", () => {
  render(
    <StageVideoFrame className="mine">
      <span>Loading…</span>
    </StageVideoFrame>,
  );
  expect(screen.getByText("Loading…").parentElement).toHaveClass("mine");
});
