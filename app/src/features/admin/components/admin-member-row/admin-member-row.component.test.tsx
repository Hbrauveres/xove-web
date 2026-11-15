import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { AdminMemberRow } from "./admin-member-row.component";

const ana = () => ({ id: 2, email: "ana@example.com", name: "Ana Souza", avatarUrl: null, admin: false });

it("shows a member's name and email, and asks about their removal by their id", async () => {
  const onAsk = vi.fn();
  render(<AdminMemberRow member={ana()} busy={false} asking={false} onAsk={onAsk} onRemove={vi.fn()} />);
  expect(screen.getByText("Ana Souza")).toBeInTheDocument();
  expect(screen.getByText("ana@example.com")).toBeInTheDocument();
  await userEvent.setup().click(screen.getByRole("button", { name: "Remove" }));
  expect(onAsk).toHaveBeenCalledWith(2);
});

it("while asked about, removes them by their id, or takes the question back", async () => {
  const onAsk = vi.fn();
  const onRemove = vi.fn();
  render(<AdminMemberRow member={ana()} busy={false} asking onAsk={onAsk} onRemove={onRemove} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Remove Ana" }));
  expect(onRemove).toHaveBeenCalledWith(2);
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onAsk).toHaveBeenCalledWith(null);
});

it("never offers to remove an admin: it says Admin instead", () => {
  render(
    <AdminMemberRow
      member={{ ...ana(), admin: true }}
      busy={false}
      asking={false}
      onAsk={vi.fn()}
      onRemove={vi.fn()}
    />,
  );
  expect(screen.getByText("Admin")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it("shows the email as the name when there's no name", () => {
  render(
    <AdminMemberRow member={{ ...ana(), name: null }} busy={false} asking={false} onAsk={vi.fn()} onRemove={vi.fn()} />,
  );
  expect(screen.getAllByText("ana@example.com")).toHaveLength(2);
});
