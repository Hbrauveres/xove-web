import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { AccessRequestView, MemberView } from "@services/xove-api-service";
import { aUser, installFakeApi } from "../../../../testing/fakeApi";
import { renderApp } from "../../../../testing/renderApp";

const anAdmin = () => aUser({ email: "admin@example.com", name: "Admin", status: "MEMBER", admin: true });
const aRequest = (): AccessRequestView => ({
  id: 7,
  email: "bruno@example.com",
  name: "Bruno",
  avatarUrl: null,
  message: "it's me",
  createdAt: new Date().toISOString(),
});
const someMembers = (): MemberView[] => [
  { id: 1, email: "admin@example.com", name: "Admin", avatarUrl: null, admin: true },
  { id: 2, email: "ana@example.com", name: "Ana Souza", avatarUrl: null, admin: false },
];

describe("the admin page", () => {
  it("shows its bar, then who's waiting with their note, and the members", async () => {
    installFakeApi({ me: anAdmin(), requests: [aRequest()], members: someMembers() });
    renderApp("/admin");

    expect(await screen.findByText("bruno@example.com")).toBeInTheDocument();
    expect(screen.getByText(/it's me/)).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(within(screen.getByRole("banner")).getByRole("link", { name: "Back to the room" })).toBeInTheDocument();
    expect(within(screen.getByRole("main")).getByRole("region", { name: /^Members/ })).toBeInTheDocument();
  });

  it("approves a request, and the list comes back without it", async () => {
    const server = installFakeApi({ me: anAdmin(), requests: [aRequest()], members: someMembers() });
    renderApp("/admin");

    await userEvent.setup().click(await screen.findByRole("button", { name: "Approve" }));

    expect(await screen.findByText("No one is waiting right now.")).toBeInTheDocument();
    expect(server.calls.some((c) => c.path === "/api/admin/access-requests/7/approve")).toBe(true);
  });

  it("removes a member after asking, and the list comes back without them", async () => {
    installFakeApi({ me: anAdmin(), requests: [], members: someMembers() });
    renderApp("/admin");
    const user = userEvent.setup();

    const ana = (await screen.findByText("ana@example.com")).closest("li") ?? document.body;
    await user.click(within(ana).getByRole("button", { name: "Remove" }));
    await user.click(within(ana).getByRole("button", { name: "Remove Ana" }));

    expect(await screen.findByText("admin@example.com")).toBeInTheDocument();
    expect(screen.queryByText("ana@example.com")).not.toBeInTheDocument();
  });

  it("shows the API's error when an action fails, and keeps the lists", async () => {
    const server = installFakeApi({ me: anAdmin(), requests: [aRequest()], members: someMembers() });
    server.failures.set("POST /api/admin/access-requests/7/approve", {
      status: 409,
      body: { detail: "This request was already decided" },
    });
    renderApp("/admin");

    await userEvent.setup().click(await screen.findByRole("button", { name: "Approve" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("This request was already decided");
    expect(screen.getByText("bruno@example.com")).toBeInTheDocument();
  });
});
