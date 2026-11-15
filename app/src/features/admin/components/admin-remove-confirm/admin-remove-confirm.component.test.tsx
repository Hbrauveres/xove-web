import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { AdminRemoveConfirm } from "./admin-remove-confirm.component";

it("asks first, with Remove Ana and Cancel, and Cancel takes it back", async () => {
  const onRemove = vi.fn(() => Promise.resolve());
  render(<AdminRemoveConfirm firstName="Ana" busy={false} onRemove={onRemove} />);
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: "Remove" }));
  expect(onRemove).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Cancel" }));

  expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Remove Ana" })).not.toBeInTheDocument();
});

it("removes once confirmed, then closes the question", async () => {
  const onRemove = vi.fn(() => Promise.resolve());
  render(<AdminRemoveConfirm firstName="Ana" busy={false} onRemove={onRemove} />);
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: "Remove" }));
  await user.click(screen.getByRole("button", { name: "Remove Ana" }));

  expect(onRemove).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
});

it("waits while another action runs", async () => {
  render(<AdminRemoveConfirm firstName="Ana" busy onRemove={() => Promise.resolve()} />);
  await userEvent.setup().click(screen.getByRole("button", { name: "Remove" }));
  expect(screen.getByRole("button", { name: "Remove Ana" })).toBeDisabled();
});
