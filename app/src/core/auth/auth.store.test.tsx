import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { aUser, installFakeApi } from "../../test/fakeApi";
import { AuthProvider } from "./auth.store";
import { useAuth } from "./use-auth.hook";

/** Shows what the provider knows, with its two actions as buttons. */
function Probe() {
  const { state, refresh, signOut } = useAuth();
  return (
    <>
      <p>{state.status === "signedIn" ? `signed in as ${state.me.email}` : state.status}</p>
      <button onClick={() => void refresh()}>Refresh</button>
      <button onClick={() => void signOut()}>Sign out</button>
    </>
  );
}

const renderProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

describe("who is signed in", () => {
  it("is loading until the API answers, then signed in as the API's person", async () => {
    installFakeApi({ me: aUser({ email: "ana@example.com" }) });
    renderProvider();

    expect(screen.getByText("loading")).toBeInTheDocument();
    expect(await screen.findByText("signed in as ana@example.com")).toBeInTheDocument();
  });

  it("is signed out when the API says the session isn't there", async () => {
    installFakeApi({ me: null });
    renderProvider();

    expect(await screen.findByText("signedOut")).toBeInTheDocument();
  });

  it("asks the API again on refresh, after being approved", async () => {
    const server = installFakeApi({ me: null });
    renderProvider();
    await screen.findByText("signedOut");

    server.me = aUser({ email: "new@example.com" });
    await userEvent.click(screen.getByRole("button", { name: "Refresh" }));

    expect(await screen.findByText("signed in as new@example.com")).toBeInTheDocument();
  });

  it("signs out through the API and shows signed out", async () => {
    const server = installFakeApi({ me: aUser() });
    renderProvider();
    await screen.findByText(/signed in/);

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByText("signedOut")).toBeInTheDocument();
    expect(server.calls.at(-1)).toMatchObject({ method: "POST", path: "/api/auth/logout" });
  });
});
