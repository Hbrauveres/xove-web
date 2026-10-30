import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ICONS } from "@shared/constants/icons.constants";
import { Icon } from "./icon.component";
import type { IconName } from "@shared/types/icon.types";

describe("an icon", () => {
  it("is decoration: hidden from screen readers, so its button's name is what's read", () => {
    const { container } = render(<Icon name="mic" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("draws each icon by its name, on its own grid", () => {
    for (const name of Object.keys(ICONS) as IconName[]) {
      const { container, unmount } = render(<Icon name={name} />);
      const svg = container.querySelector(`svg[data-icon="${name}"]`);
      expect(svg, name).not.toBeNull();
      expect(svg?.children.length, name).toBe(ICONS[name].parts.length);
      unmount();
    }
    const { container } = render(<Icon name="cog" />);
    expect(container.querySelector("svg")).toHaveAttribute("viewBox", "0 0 24 24");
  });

  it("takes the size it's given, or leaves it to its CSS", () => {
    const { container, rerender } = render(<Icon name="swap" size={16} />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "16");
    rerender(<Icon name="swap" />);
    expect(container.querySelector("svg")).not.toHaveAttribute("width");
  });
});
