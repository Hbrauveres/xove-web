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
});
