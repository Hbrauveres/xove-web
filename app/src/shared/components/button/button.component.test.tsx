import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Button } from "./button.component";

it("is a plain button, not a form's submit unless asked, and passes its props on", async () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Join the queue again</Button>);
  const button = screen.getByRole("button", { name: "Join the queue again" });
  expect(button).toHaveAttribute("type", "button");
  await userEvent.setup().click(button);
  expect(onClick).toHaveBeenCalled();
});

it("can submit a form", () => {
  render(<Button type="submit">Request access</Button>);
  expect(screen.getByRole("button", { name: "Request access" })).toHaveAttribute("type", "submit");
});
