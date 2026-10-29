import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PhoneNoticePage } from "../phone-notice.page";

describe("the phone and tablet screen", () => {
  it("says to come back on the big screen, sorry, and where", () => {
    render(<PhoneNoticePage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("See you on the big screen.");
    expect(screen.getByText(/^Sorry, Xovê doesn't work on phones or tablets yet\./)).toHaveTextContent(
      "Open xove.app on your laptop or desktop to watch and share with your friends.",
    );
    expect(screen.getByRole("img", { name: "Xovê" })).toBeInTheDocument();
  });

  it("offers nothing to press: the address is to type on the computer", () => {
    render(<PhoneNoticePage />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
