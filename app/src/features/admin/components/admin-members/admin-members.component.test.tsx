import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { AdminMembers } from "./admin-members.component";

it("counts the members under its heading, lists each, and says what removing does", () => {
  render(
    <AdminMembers
      members={[
        { id: 1, email: "admin@example.com", name: "Henrique", avatarUrl: null, admin: true },
        { id: 2, email: "ana@example.com", name: "Ana Souza", avatarUrl: null, admin: false },
      ]}
      busy={false}
      onRemove={() => Promise.resolve()}
    />,
  );
  expect(screen.getByRole("region", { name: /Members/ })).toHaveTextContent("2");
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(
    screen.getByText("Removing someone signs them out everywhere. They can ask for access again."),
  ).toBeInTheDocument();
});
