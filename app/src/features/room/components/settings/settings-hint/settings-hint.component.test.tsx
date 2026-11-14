import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { SettingsHint } from "./settings-hint.component";

it("is read as a paragraph of the panel, not a control's name", () => {
  render(<SettingsHint>Used the next time you share.</SettingsHint>);
  expect(screen.getByRole("paragraph")).toHaveTextContent("Used the next time you share.");
});
