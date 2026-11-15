import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { GOOGLE_LOGIN_URL } from "@services/xove-api-service";
import { SIGN_IN_ERRORS } from "./constants/sign-in-errors.constants";
import { HomePage } from "./home.page";

function renderAt(address: string) {
  return render(
    <MemoryRouter initialEntries={[address]}>
      <HomePage />
    </MemoryRouter>,
  );
}

describe("the sign-in page", () => {
  it("shows the drawn mark, not the typed name", () => {
    renderAt("/");
    expect(screen.getByLabelText("Xovê")).toBeInTheDocument();
    expect(screen.queryByText(/xovê/)).not.toBeInTheDocument();
  });

  it("says what Xovê is: Go LIVE with your friends, LIVE marked, and one short line", () => {
    renderAt("/");
    // Two lines; "live" is a word to a screen reader, shown in capitals.
    const title = screen.getByRole("heading", { level: 1 });
    expect(title.innerHTML).toBe("Go <em>live</em> with<br>your friends.");
    expect(screen.getByRole("region", { name: /^Go live with/ })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Share your screen or camera in sharp, fast streams. Watch them play, hang out, help out. Invite only.",
      ),
    ).toBeInTheDocument();
  });

  it("has one way in: Continue with Google, a link to the API's sign-in", () => {
    renderAt("/");
    expect(screen.getByRole("link", { name: "Continue with Google" })).toHaveAttribute("href", GOOGLE_LOGIN_URL);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("says why a sign-in came back with an error, above the way in", () => {
    renderAt("/?error=login-failed");
    expect(screen.getByRole("alert")).toHaveTextContent(SIGN_IN_ERRORS["login-failed"]);
    expect(screen.getByRole("link", { name: "Continue with Google" })).toBeInTheDocument();
  });
});
