import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StageSmallViewButton } from "./stage-small-view-button.component";

const fold = (folded: boolean) => ({
  folded,
  hide: vi.fn(),
  show: vi.fn(),
  setBox: vi.fn(),
  setHide: vi.fn(),
  setCorner: vi.fn(),
});

describe("the small view's corner button", () => {
  it("while the small view is folded, opens it again", async () => {
    const f = fold(true);
    render(<StageSmallViewButton fold={f} />);
    await userEvent.click(screen.getByRole("button", { name: "Show the small view" }));
    expect(f.show).toHaveBeenCalledOnce();
  });

  it("while it's open, is out of reach", () => {
    render(<StageSmallViewButton fold={fold(false)} />);
    expect(screen.queryByRole("button", { name: "Show the small view" })).not.toBeInTheDocument();
  });
});
