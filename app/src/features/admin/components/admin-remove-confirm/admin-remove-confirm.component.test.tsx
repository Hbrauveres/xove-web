import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { AdminRemoveConfirm } from "./admin-remove-confirm.component";

it("asks first: Remove asks, without removing", async () => {
  const onAsk = vi.fn();
  const onRemove = vi.fn();
  render(<AdminRemoveConfirm firstName="Ana" asking={false} busy={false} onAsk={onAsk} onRemove={onRemove} />);
  await userEvent.setup().click(screen.getByRole("button", { name: "Remove" }));
  expect(onAsk).toHaveBeenCalledWith(true);
  expect(onRemove).not.toHaveBeenCalled();
});

it("while asking, offers Remove Ana and Cancel, and Cancel takes the question back", async () => {
  const onAsk = vi.fn();
  const onRemove = vi.fn();
  render(<AdminRemoveConfirm firstName="Ana" asking busy={false} onAsk={onAsk} onRemove={onRemove} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onAsk).toHaveBeenCalledWith(false);
  await user.click(screen.getByRole("button", { name: "Remove Ana" }));
  expect(onRemove).toHaveBeenCalledTimes(1);
});

it("waits while another action runs", () => {
  render(<AdminRemoveConfirm firstName="Ana" asking busy onAsk={vi.fn()} onRemove={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Remove Ana" })).toBeDisabled();
});
