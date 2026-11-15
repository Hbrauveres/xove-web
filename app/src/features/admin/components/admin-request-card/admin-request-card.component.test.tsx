import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import type { AccessRequestView } from "@services/xove-api-service";
import { AdminRequestCard } from "./admin-request-card.component";

const bruno = (): AccessRequestView => ({
  id: 7,
  email: "bruno@example.com",
  name: "Bruno",
  avatarUrl: null,
  message: "it's me",
  createdAt: "2026-11-14T10:00:00Z",
});

it("shows who asks, when, and their note, quoted", () => {
  vi.setSystemTime(new Date("2026-11-14T10:03:00Z"));
  render(<AdminRequestCard request={bruno()} busy={false} onApprove={vi.fn()} onDecline={vi.fn()} />);
  expect(screen.getByText("Bruno")).toBeInTheDocument();
  expect(screen.getByText("bruno@example.com")).toBeInTheDocument();
  expect(screen.getByText("“it's me”")).toBeInTheDocument();
  expect(screen.getByText("3 min ago")).toHaveAttribute("datetime", "2026-11-14T10:00:00Z");
});

it("approves or declines this request", async () => {
  const onApprove = vi.fn();
  const onDecline = vi.fn();
  render(<AdminRequestCard request={bruno()} busy={false} onApprove={onApprove} onDecline={onDecline} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Approve" }));
  await user.click(screen.getByRole("button", { name: "Decline" }));
  expect(onApprove).toHaveBeenCalledWith(7);
  expect(onDecline).toHaveBeenCalledWith(7);
});

it("waits while another action runs, and leaves out a note never written", () => {
  render(<AdminRequestCard request={{ ...bruno(), message: null }} busy onApprove={vi.fn()} onDecline={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Decline" })).toBeDisabled();
  expect(screen.queryByText(/“/)).not.toBeInTheDocument();
});
