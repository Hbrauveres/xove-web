import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { RequestAccessWaiting } from "./request-access-waiting.component";

it("says the request went, and its wait as a status", () => {
  render(<RequestAccessWaiting />);
  expect(screen.getByRole("heading", { level: 1, name: "Request sent" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Waiting for approval");
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
});
