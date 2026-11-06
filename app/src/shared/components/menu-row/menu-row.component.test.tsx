import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { toastStore } from "@shared/stores/toast-store";
import { MenuRow } from "./menu-row.component";

describe("a menu's row", () => {
  it("is a button that does its action", async () => {
    const onPick = vi.fn();
    render(<MenuRow icon="sign-out" label="Sign out" onPick={onPick} />);
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it("is a link when it goes to a page", () => {
    render(
      <MemoryRouter>
        <MenuRow icon="shield" label="Admin" to="/admin" />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin");
  });

  it("takes the role its menu gives it", () => {
    render(<MenuRow icon="cog" label="Settings" role="menuitem" onPick={() => undefined} />);
    expect(screen.getByRole("menuitem", { name: "Settings" })).toBeInTheDocument();
  });

  it("when it can't be used, says why instead of acting", async () => {
    const onPick = vi.fn();
    render(
      <MenuRow icon="screen-off" label="Share your screen" unavailable="All 6 places are taken" onPick={onPick} />,
    );
    const row = screen.getByRole("button", { name: "Share your screen" });
    expect(row).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(row);
    expect(onPick).not.toHaveBeenCalled();
    expect(toastStore.current()?.text).toBe("All 6 places are taken");
  });
});
