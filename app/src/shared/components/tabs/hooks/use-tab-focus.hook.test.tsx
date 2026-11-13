import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useTabFocus } from "./use-tab-focus.hook";

function Two({ chosen, focused }: { chosen: "a" | "b"; focused: boolean }) {
  const { refOf } = useTabFocus(chosen, focused);
  return (
    <>
      <button type="button" ref={refOf("a")}>
        A
      </button>
      <button type="button" ref={refOf("b")}>
        B
      </button>
    </>
  );
}

describe("the tabs' focus", () => {
  it("goes to the chosen tab when told to take it, and only then", () => {
    const { rerender } = render(<Two chosen="b" focused={false} />);
    expect(document.body).toHaveFocus();
    rerender(<Two chosen="b" focused />);
    expect(screen.getByRole("button", { name: "B" })).toHaveFocus();
    screen.getByRole("button", { name: "A" }).focus();
    rerender(<Two chosen="a" focused />);
    rerender(<Two chosen="b" focused />);
    expect(screen.getByRole("button", { name: "A" })).toHaveFocus();
  });
});
