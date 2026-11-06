import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IconButton } from "./icon-button.component";

describe("an icon button", () => {
  it("is a button named by its label, which clicks", async () => {
    const onClick = vi.fn();
    render(
      <IconButton variant="round" size="m" aria-label="Settings" onClick={onClick}>
        <svg aria-hidden="true" />
      </IconButton>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Settings" })).toHaveAttribute("type", "button");
  });

  it("says whether it's on, as a toggle does", () => {
    render(
      <IconButton variant="round" size="m" aria-label="Their sound" aria-pressed>
        <svg aria-hidden="true" />
      </IconButton>,
    );
    expect(screen.getByRole("button", { name: "Their sound", pressed: true })).toBeInTheDocument();
  });

  it("is disabled for assistive tech while it can't be used", () => {
    render(
      <IconButton variant="round" size="l" aria-label="Share your screen" unavailable>
        <svg aria-hidden="true" />
      </IconButton>,
    );
    expect(screen.getByRole("button", { name: "Share your screen" })).toHaveAttribute("aria-disabled", "true");
  });
});
