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
      asking={null}
      onAsk={() => undefined}
      onRemove={() => undefined}
    />,
  );
  expect(screen.getByRole("region", { name: /Members/ })).toHaveTextContent("2");
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(
    screen.getByText("Removing someone signs them out everywhere. They can ask for access again."),
  ).toBeInTheDocument();
});

it("asks about one member at a time: only the member asked about shows Remove and their name", () => {
  render(
    <AdminMembers
      members={[
        { id: 2, email: "ana@example.com", name: "Ana Souza", avatarUrl: null, admin: false },
        { id: 3, email: "rafa@example.com", name: "Rafa Lima", avatarUrl: null, admin: false },
      ]}
      busy={false}
      asking={3}
      onAsk={() => undefined}
      onRemove={() => undefined}
    />,
  );
  expect(screen.getByRole("button", { name: "Remove Rafa" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Remove Ana" })).not.toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(1);
});
