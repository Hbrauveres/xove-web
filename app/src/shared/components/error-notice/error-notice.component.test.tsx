import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorNotice } from "./error-notice.component";

describe("an error notice", () => {
  it("is read out as soon as it appears", () => {
    render(<ErrorNotice>Couldn't join the room.</ErrorNotice>);
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't join the room.");
  });
});
