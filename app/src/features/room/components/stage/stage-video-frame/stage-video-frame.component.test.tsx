import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { StageVideoFrame } from "./stage-video-frame.component";

it("gives its holder the box the picture is in, to measure and place it", () => {
  const box = createRef<HTMLSpanElement>();
  render(
    <StageVideoFrame ref={box}>
      <video aria-label="Rafa's screen" />
    </StageVideoFrame>,
  );
  expect(box.current).toContainElement(screen.getByLabelText("Rafa's screen"));
});
