import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { LabelPill } from "./label-pill.component";

it("shows its lead, then its words", () => {
  const { container } = render(<LabelPill lead={<i>face</i>}>Ana · camera</LabelPill>);
  expect(container.firstElementChild).toHaveTextContent(/^faceAna · camera$/);
});
