import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeaderActivityTicker } from "./header-activity-ticker.component";

const latest = { id: "1", text: "Ana joined", ago: "2 min", actor: { id: "ana", name: "Ana", hue: 300, online: true } };

describe("the activity pill's line", () => {
  it("shows the latest event with how long ago", () => {
    render(<HeaderActivityTicker reconnecting={null} latest={latest} />);
    expect(screen.getByText("Ana joined")).toBeInTheDocument();
    expect(screen.getByText("2 min").tagName).toBe("TIME");
  });

  it("says the connection dropped instead of the event", () => {
    render(<HeaderActivityTicker reconnecting="Connection dropped. Reconnecting" latest={latest} />);
    expect(screen.getByText("Connection dropped. Reconnecting…")).toBeInTheDocument();
    expect(screen.queryByText("Ana joined")).not.toBeInTheDocument();
  });

  it("is calm before anything happened", () => {
    render(<HeaderActivityTicker reconnecting={null} latest={null} />);
    expect(screen.getByText("Nothing new yet")).toBeInTheDocument();
  });
});
