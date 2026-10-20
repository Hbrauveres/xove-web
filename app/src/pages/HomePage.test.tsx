import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { installFakeApi } from "../test/fakeApi";
import { renderApp } from "../test/renderApp";

describe("home page", () => {
  it("shows the drawn mark, not the typed name (spec 0111)", async () => {
    installFakeApi({ me: null });
    renderApp("/");

    expect(await screen.findByRole("img", { name: "Xovê" })).toBeInTheDocument();
    expect(screen.queryByText(/xovê/)).not.toBeInTheDocument();
  });

  it("says what Xovê is: Go LIVE with your friends, LIVE marked, and one short line (spec 0141)", async () => {
    installFakeApi({ me: null });
    renderApp("/");

    const title = await screen.findByRole("heading", { level: 1 });
    expect(title).toHaveTextContent(/^Go LIVE with\s*your friends\.$/);
    expect(title.querySelector("em")).toHaveTextContent(/^LIVE$/);
    expect(
      screen.getByText("Share your screen or camera in sharp, fast streams. Watch them play, hang out, help out. Invite only."),
    ).toBeInTheDocument();
  });
});
