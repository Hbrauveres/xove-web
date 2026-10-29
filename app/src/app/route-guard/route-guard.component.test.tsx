import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { AuthProvider } from "@core/auth/auth.store";
import { aUser, installFakeApi } from "../../test/fakeApi";
import { RouteGuard } from "./route-guard.component";

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<p>home</p>} />
          <Route path="/request-access" element={<p>request access</p>} />
          <Route
            path="/room"
            element={
              <RouteGuard rule="member">
                <p>the room</p>
              </RouteGuard>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("a guarded page", () => {
  it("says it's loading while the API hasn't answered, then shows the page to who it's for", async () => {
    installFakeApi({ me: aUser({ status: "MEMBER" }) });
    renderAt("/room");

    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(await screen.findByText("the room")).toBeInTheDocument();
  });

  it("sends anyone else where they belong", async () => {
    installFakeApi({ me: aUser({ status: "PENDING" }) });
    renderAt("/room");

    expect(await screen.findByText("request access")).toBeInTheDocument();
    expect(screen.queryByText("the room")).not.toBeInTheDocument();
  });
});
