import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Switch } from "./switch.component";

describe("a switch", () => {
  it("is a switch named by its words, saying whether it's on", () => {
    render(<Switch label="Ambilight" checked onToggle={() => undefined} />);
    expect(screen.getByRole("switch", { name: "Ambilight" })).toBeChecked();
    expect(screen.getByText("Ambilight")).toBeInTheDocument();
  });

  it("turns on and off with a click", async () => {
    const onToggle = vi.fn();
    render(<Switch label="Noise gate" checked={false} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole("switch", { name: "Noise gate" }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("says it can't be used here, and leaves what a click does to the piece using it", () => {
    render(<Switch label="Voice isolation" checked={false} unavailable onToggle={() => undefined} />);
    expect(screen.getByRole("switch", { name: "Voice isolation" })).toHaveAttribute("aria-disabled", "true");
  });
});
