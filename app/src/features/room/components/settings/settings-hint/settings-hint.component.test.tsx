import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { SettingsHint } from "./settings-hint.component";

it("is a line of text, read as part of the panel", () => {
  render(<SettingsHint>Used the next time you share.</SettingsHint>);
  expect(screen.getByText("Used the next time you share.").tagName).toBe("P");
});
