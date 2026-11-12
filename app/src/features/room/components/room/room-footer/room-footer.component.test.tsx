import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoomFooter } from "./room-footer.component";

describe("the room's footer", () => {
  it("says who made it, and names the links to come, not yet clickable", () => {
    render(<RoomFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent("xovê · Made by Hbrauveres");
    expect(footer).toHaveTextContent("Buy me a coffee");
    expect(footer).toHaveTextContent("GitHub");
    expect(footer).toHaveTextContent("LinkedIn");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
