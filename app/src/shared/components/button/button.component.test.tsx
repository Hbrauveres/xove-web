import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Button } from "./button.component";
import styles from "./button.component.module.css";

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

it("goes to a page in the app as a link, with the button's look", () => {
  render(
    <MemoryRouter>
      <Button to="/room" variant="quiet">
        Back to the room
      </Button>
    </MemoryRouter>,
  );
  const link = screen.getByRole("link", { name: "Back to the room" });
  expect(link).toHaveAttribute("href", "/room");
  expect(link.className).toContain(styles.quiet);
});

it("leaves the app as a plain link", () => {
  render(
    <Button href="/api/oauth2/authorization/google" variant="light">
      Continue with Google
    </Button>,
  );
  const link = screen.getByRole("link", { name: "Continue with Google" });
  expect(link).toHaveAttribute("href", "/api/oauth2/authorization/google");
  expect(link.className).toContain(styles.light);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
