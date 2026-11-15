import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AdminRequests } from "./admin-requests.component";

const aRequest = (id: number, name: string) => ({
  id,
  email: `${name.toLowerCase()}@example.com`,
  name,
  avatarUrl: null,
  message: null,
  createdAt: new Date().toISOString(),
});

it("counts who's waiting under its heading, and lists each", () => {
  render(
    <AdminRequests
      requests={[aRequest(7, "Bruno"), aRequest(8, "Rafa")]}
      busy={false}
      onApprove={vi.fn()}
      onDecline={vi.fn()}
    />,
  );
  expect(screen.getByRole("region", { name: /Waiting for access/ })).toHaveTextContent("2");
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
});

it("says no one is waiting, with no list", () => {
  render(<AdminRequests requests={[]} busy={false} onApprove={vi.fn()} onDecline={vi.fn()} />);
  expect(screen.getByText("No one is waiting right now.")).toBeInTheDocument();
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
});
