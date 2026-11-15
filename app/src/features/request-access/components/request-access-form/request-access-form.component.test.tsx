import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { aUser, installFakeApi } from "../../../../testing/fakeApi";
import { RequestAccessForm } from "./request-access-form.component";

it("asks for access with an optional note, and says when it went", async () => {
  installFakeApi({ me: aUser({ status: "NONE" }) });
  const onSent = vi.fn(() => Promise.resolve());
  render(<RequestAccessForm declined={false} onSent={onSent} />);
  const user = userEvent.setup();

  expect(screen.getByRole("heading", { level: 1, name: "You need access" })).toBeInTheDocument();
  await user.type(screen.getByLabelText(/message/i), "it's me, Bruno");
  await user.click(screen.getByRole("button", { name: "Request access" }));

  expect(onSent).toHaveBeenCalled();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("tells someone declined, and asks again", () => {
  render(<RequestAccessForm declined onSent={() => Promise.resolve()} />);
  expect(screen.getByRole("heading", { name: "Your request was declined" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Ask again" })).toBeInTheDocument();
});

it("shows the API's error as an alert, and keeps the form", async () => {
  const server = installFakeApi({ me: aUser({ status: "NONE" }) });
  server.failures.set("POST /api/access-requests", {
    status: 400,
    body: { detail: "Message is too long (max 500 characters)" },
  });
  render(<RequestAccessForm declined={false} onSent={() => Promise.resolve()} />);

  await userEvent.setup().click(screen.getByRole("button", { name: "Request access" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Message is too long (max 500 characters)");
  expect(screen.getByRole("button", { name: "Request access" })).toBeEnabled();
});
