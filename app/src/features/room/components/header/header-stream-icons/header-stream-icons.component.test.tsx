import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { HeaderStreamIcons } from "./header-stream-icons.component";

it("draws one icon per stream shared, only for the eye", () => {
  const { container } = render(<HeaderStreamIcons kinds={["screen", "camera"]} />);
  const icons = container.firstElementChild;
  expect(icons).toHaveAttribute("aria-hidden", "true");
  expect(icons?.querySelectorAll("svg")).toHaveLength(2);
});
