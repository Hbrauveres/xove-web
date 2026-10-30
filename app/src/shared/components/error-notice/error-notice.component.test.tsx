import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorNotice } from "./error-notice.component";

describe("an error notice", () => {
  it("is read out as soon as it appears", () => {
    render(<ErrorNotice>Couldn't join the room.</ErrorNotice>);
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't join the room.");
  });

  it("takes the opaque look only when it floats over something", () => {
    const { rerender } = render(<ErrorNotice>Couldn't join the room.</ErrorNotice>);
    expect(screen.getByRole("alert")).not.toHaveAttribute("data-floating");
    rerender(<ErrorNotice floating>Couldn't join the room.</ErrorNotice>);
    expect(screen.getByRole("alert")).toHaveAttribute("data-floating");
  });
});
