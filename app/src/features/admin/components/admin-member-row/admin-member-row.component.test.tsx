import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { AdminMemberRow } from "./admin-member-row.component";

const ana = () => ({ id: 2, email: "ana@example.com", name: "Ana Souza", avatarUrl: null, admin: false });

it("shows a member's name and email, and removes them after asking", async () => {
  const onRemove = vi.fn(() => Promise.resolve());
  render(<AdminMemberRow member={ana()} busy={false} onRemove={onRemove} />);
  const user = userEvent.setup();

  expect(screen.getByText("Ana Souza")).toBeInTheDocument();
  expect(screen.getByText("ana@example.com")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Remove" }));
  await user.click(screen.getByRole("button", { name: "Remove Ana" }));

  expect(onRemove).toHaveBeenCalledWith(2);
});

it("never offers to remove an admin: it says Admin instead", () => {
  render(<AdminMemberRow member={{ ...ana(), admin: true }} busy={false} onRemove={() => Promise.resolve()} />);
  expect(screen.getByText("Admin")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it("shows the email as the name when there's no name", () => {
  render(<AdminMemberRow member={{ ...ana(), name: null }} busy={false} onRemove={() => Promise.resolve()} />);
  expect(screen.getAllByText("ana@example.com")).toHaveLength(2);
});
