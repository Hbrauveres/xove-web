import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { HomeGoogleMark } from "./home-google-mark.component";

it("is only seen: the button's words say Google", () => {
  const { container } = render(<HomeGoogleMark />);
  expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
});
