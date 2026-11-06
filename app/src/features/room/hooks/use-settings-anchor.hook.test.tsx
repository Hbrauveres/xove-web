import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsAnchorContext, useSettingsAnchor } from "./use-settings-anchor.hook";

function Cog() {
  const anchor = useSettingsAnchor();
  return (
    <div ref={anchor?.row}>
      <button type="button" ref={anchor?.cog}>
        Settings
      </button>
    </div>
  );
}

describe("the settings' anchor", () => {
  it("hands the stage the cog and its row", () => {
    const anchor = { cog: vi.fn(), row: vi.fn() };
    render(
      <SettingsAnchorContext value={anchor}>
        <Cog />
      </SettingsAnchorContext>,
    );
    const cog = screen.getByRole("button", { name: "Settings" });
    expect(anchor.cog).toHaveBeenCalledWith(cog);
    expect(anchor.row).toHaveBeenCalledWith(cog.parentElement);
  });

  it("is nothing outside a stage", () => {
    expect(() => render(<Cog />)).not.toThrow();
  });
});
