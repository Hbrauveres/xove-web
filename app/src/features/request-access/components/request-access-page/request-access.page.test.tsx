import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { aUser, installFakeApi } from "../../../../testing/fakes/api.fake";
import { renderApp } from "../../../../testing/factories/app-render.factory";
import { APPROVAL_CHECK_MS } from "./constants/request-access.constants";

describe("the request access page", () => {
  it("shows the drawn mark and who is signed in", async () => {
    installFakeApi({ me: aUser({ email: "bruno@example.com" }) });
    renderApp("/request-access");

    expect(await screen.findByText("bruno@example.com")).toBeInTheDocument();
    expect(screen.getByText("Signed in as")).toBeInTheDocument();
    expect(screen.getByLabelText("Xovê")).toBeInTheDocument();
    expect(screen.queryByText(/xovê/)).not.toBeInTheDocument();
  });

  it("asks, then waits once the request went", async () => {
    installFakeApi({ me: aUser({ status: "NONE" }) });
    renderApp("/request-access");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Request access" }));

    expect(await screen.findByRole("heading", { name: "Request sent" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Waiting for approval");
  });

  it("moves a waiting person into the room once approved", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const server = installFakeApi({ me: aUser({ status: "PENDING" }) });
    renderApp("/request-access");
    expect(await screen.findByRole("heading", { name: "Request sent" })).toBeInTheDocument();

    server.me = aUser({ status: "MEMBER" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(APPROVAL_CHECK_MS);
    });

    await waitFor(() => expect(screen.getByRole("button", { name: /(people|person) here/i })).toBeInTheDocument());
  });

  it("uses another account: signs out and goes to the sign-in page", async () => {
    installFakeApi({ me: aUser({ email: "bruno@example.com" }) });
    renderApp("/request-access");

    await userEvent.setup().click(await screen.findByRole("button", { name: "Use another account" }));

    expect(await screen.findByRole("link", { name: "Continue with Google" })).toBeInTheDocument();
    expect(screen.queryByText("bruno@example.com")).not.toBeInTheDocument();
  });
});
