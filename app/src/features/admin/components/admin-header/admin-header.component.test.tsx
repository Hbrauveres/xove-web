import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, it } from "vitest";
import { AdminHeader } from "./admin-header.component";

it("shows the drawn mark with 'admin' beside it, and the way back to the room", () => {
  render(
    <MemoryRouter>
      <AdminHeader />
    </MemoryRouter>,
  );
  expect(screen.getByLabelText("Xovê")).toBeInTheDocument();
  expect(screen.getByText("admin")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to the room" })).toHaveAttribute("href", "/room");
});
