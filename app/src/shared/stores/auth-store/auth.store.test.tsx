import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { aUser, installFakeApi } from "../../../testing/fakes/api.fake";
import { AuthProvider } from "./auth.store";
import { useAuth } from "./hooks/use-auth.hook";

/** Shows what the provider knows, with its two actions as buttons. */
function Probe() {
  const { state, refresh, signOut } = useAuth();
  return (
    <>
      <p>{state.status === "signedIn" ? `signed in as ${state.me.email}` : state.status}</p>
      <button onClick={() => void refresh().catch(() => undefined)}>Refresh</button>
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

  it("isn't signed out when the API can't be reached or fails: only its 'nobody is signed in' signs out", async () => {
    const down = installFakeApi({ me: aUser() });
    down.unreachable.add("GET /api/me");
    const first = renderProvider();
    expect(await screen.findByText("unreachable")).toBeInTheDocument();
    first.unmount();

    const gateway = installFakeApi({ me: aUser() });
    gateway.failures.set("GET /api/me", { status: 502 });
    const second = renderProvider();
    expect(await screen.findByText("unreachable")).toBeInTheDocument();
    second.unmount();

    const failing = installFakeApi({ me: aUser() });
    failing.failures.set("GET /api/me", { status: 500 });
    renderProvider();
    expect(await screen.findByText("failed")).toBeInTheDocument();
  });

  it("keeps who's signed in when a later check fails without saying they're signed out", async () => {
    const server = installFakeApi({ me: aUser({ email: "ana@example.com" }) });
    renderProvider();
    await screen.findByText("signed in as ana@example.com");

    server.unreachable.add("GET /api/me");
    await userEvent.click(screen.getByRole("button", { name: "Refresh" }));

    expect(screen.getByText("signed in as ana@example.com")).toBeInTheDocument();
  });

  it("on a later check, signs out on the API's 'nobody is signed in', and keeps who's signed in on any other answer", async () => {
    for (const status of [500, 502, 403]) {
      const server = installFakeApi({ me: aUser({ email: "ana@example.com" }) });
      const { unmount } = renderProvider();
      await screen.findByText("signed in as ana@example.com");
      server.failures.set("GET /api/me", { status });
      await userEvent.click(screen.getByRole("button", { name: "Refresh" }));
      expect(screen.getByText("signed in as ana@example.com")).toBeInTheDocument();
      unmount();
    }
    const server = installFakeApi({ me: aUser() });
    renderProvider();
    await screen.findByText(/signed in/);
    server.me = null;
    await userEvent.click(screen.getByRole("button", { name: "Refresh" }));
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
