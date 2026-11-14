import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePanelFocus } from "./use-panel-focus.hook";

function Panel({ open }: { open: boolean }) {
  const focus = usePanelFocus(open);
  return (
    <div {...focus}>
      <button type="button">Inside</button>
    </div>
  );
}

describe("the panel's focus", () => {
  it("goes back to what opened it when it closes with the focus inside", () => {
    const cog = document.createElement("button");
    document.body.append(cog);
    cog.focus();
    const { rerender } = render(<Panel open />);
    screen.getByRole("button", { name: "Inside" }).focus();
    rerender(<Panel open={false} />);
    expect(cog).toHaveFocus();
    cog.remove();
  });

  it("stays where it is when it was outside", () => {
    const cog = document.createElement("button");
    const elsewhere = document.createElement("button");
    document.body.append(cog, elsewhere);
    cog.focus();
    const { rerender } = render(<Panel open />);
    screen.getByRole("button", { name: "Inside" }).focus();
    elsewhere.focus();
    rerender(<Panel open={false} />);
    expect(elsewhere).toHaveFocus();
    cog.remove();
    elsewhere.remove();
  });
});
