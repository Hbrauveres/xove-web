import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ActionPill } from "./action-pill.component";

describe("an action pill", () => {
  it("is a button named by its words, which clicks", async () => {
    const onClick = vi.fn();
    render(
      <ActionPill size="m" fill="glass" lead="dot" onClick={onClick}>
        Go live
      </ActionPill>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Go live" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Go live" })).toHaveAttribute("type", "button");
  });

  it("is disabled for assistive tech while it can't be used", () => {
    render(
      <ActionPill size="l" fill="red" lead="screen-off" unavailable aria-label="Share your screen">
        Screen
      </ActionPill>,
    );
    expect(screen.getByRole("button", { name: "Share your screen" })).toHaveAttribute("aria-disabled", "true");
  });

  it("dark, says when it's on, and doesn't click while disabled", async () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <ActionPill size="xs" fill="dark" aria-pressed={false} onClick={onClick}>
        Test
      </ActionPill>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Test", pressed: false }));
    expect(onClick).toHaveBeenCalledOnce();
    rerender(
      <ActionPill size="xs" fill="dark" aria-pressed disabled onClick={onClick}>
        Test
      </ActionPill>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Test", pressed: true }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
