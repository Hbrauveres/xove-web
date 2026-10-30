import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IconButton } from "./icon-button.component";

describe("an icon button", () => {
  it("is a button named by its label, which clicks", async () => {
    const onClick = vi.fn();
    render(
      <IconButton variant="stage" aria-label="Settings" onClick={onClick}>
        <svg aria-hidden="true" />
      </IconButton>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Settings" })).toHaveAttribute("type", "button");
  });

  it("says whether it's on, as a toggle does", () => {
    render(
      <IconButton variant="toggle" aria-label="Their sound" aria-pressed>
        <svg aria-hidden="true" />
      </IconButton>,
    );
    expect(screen.getByRole("button", { name: "Their sound", pressed: true })).toBeInTheDocument();
  });

  it("in the player, sits in its pill, with what wraps it (its tooltip) inside", () => {
    render(
      <IconButton variant="player" aria-label="Share your screen" around={(b) => <span data-testid="tip">{b}</span>}>
        <svg aria-hidden="true" />
      </IconButton>,
    );
    const button = screen.getByRole("button", { name: "Share your screen" });
    expect(screen.getByTestId("tip")).toContainElement(button);
    expect(button.closest("div")).toContainElement(screen.getByTestId("tip"));
  });

  it("marks the player's pill open while what it opens is open", () => {
    const { container, rerender } = render(
      <IconButton variant="player" aria-label="Settings" open>
        <svg aria-hidden="true" />
      </IconButton>,
    );
    expect(container.firstElementChild).toHaveAttribute("data-open");
    rerender(
      <IconButton variant="player" aria-label="Settings">
        <svg aria-hidden="true" />
      </IconButton>,
    );
    expect(container.firstElementChild).not.toHaveAttribute("data-open");
  });
});
