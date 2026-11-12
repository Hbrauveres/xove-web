import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StageBarMenu } from "./stage-bar-menu.component";
describe("the bar's menu", () => {
  it("is a menu for a list of actions", () => {
    render(
      <StageBarMenu kind="menu" aria-label="Go live">
        <button role="menuitem">Share your screen</button>
      </StageBarMenu>,
    );
    expect(screen.getByRole("menu", { name: "Go live" })).toContainElement(screen.getByRole("menuitem"));
  });

  it("is a named group where it holds sliders too", () => {
    render(
      <StageBarMenu kind="group" aria-label="More controls" centred>
        <input type="range" aria-label="Screen sound volume" />
      </StageBarMenu>,
    );
    expect(screen.getByRole("group", { name: "More controls" })).toContainElement(screen.getByRole("slider"));
  });
});
