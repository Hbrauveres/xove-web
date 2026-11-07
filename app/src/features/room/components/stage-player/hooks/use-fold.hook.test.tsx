import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFold } from "./use-fold.hook";

/** The small view and its corner button, on the hook, as the player wires them. */
function Stage({ fits = true, picture = "marina/screen" }: { fits?: boolean; picture?: string }) {
  const { folded, hide, show, setBox, setHide, setCorner } = useFold(fits, picture);
  return (
    <>
      {!folded && (
        <div ref={setBox} data-testid="small view">
          <button ref={setHide} onClick={hide}>
            Hide the small view
          </button>
        </div>
      )}
      <button ref={setCorner} hidden={!folded} onClick={show}>
        Show the small view
      </button>
    </>
  );
}

/** A browser that animates: each move ends when the test says (`end`). */
const animating = () => {
  const moves: { onfinish: (() => void) | null }[] = [];
  Object.defineProperty(HTMLElement.prototype, "animate", {
    configurable: true,
    value: vi.fn(() => {
      const move = { onfinish: null };
      moves.push(move);
      return move;
    }),
  });
  return { moves, end: (i: number) => moves[i]?.onfinish?.() };
};

describe("useFold", () => {
  it("folds the small view once its move into the corner ends, and the focus goes to the corner", () => {
    const { end } = animating();
    render(<Stage />);
    act(() => screen.getByRole("button", { name: "Hide the small view" }).click());
    expect(screen.getByTestId("small view")).toBeInTheDocument();
    act(() => end(0));
    expect(screen.queryByTestId("small view")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Show the small view" }));
  });

  it("opens it again out of the corner, and the focus goes back to Hide", () => {
    const { moves, end } = animating();
    render(<Stage />);
    act(() => screen.getByRole("button", { name: "Hide the small view" }).click());
    act(() => end(0));
    act(() => screen.getByRole("button", { name: "Show the small view" }).click());
    expect(screen.getByTestId("small view")).toBeInTheDocument();
    expect(moves).toHaveLength(2);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Hide the small view" }));
  });

  it("with less motion asked for, folds at once, with no move", () => {
    const { moves } = animating();
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    render(<Stage />);
    act(() => screen.getByRole("button", { name: "Hide the small view" }).click());
    expect(screen.queryByTestId("small view")).not.toBeInTheDocument();
    expect(moves).toHaveLength(0);
  });

  it("folds by itself on a picture too narrow for it, without taking the focus", () => {
    const view = render(<Stage />);
    view.rerender(<Stage fits={false} />);
    expect(screen.queryByTestId("small view")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(document.body);
    view.rerender(<Stage />);
    expect(screen.getByTestId("small view")).toBeInTheDocument();
  });

  it("opened from the corner on a narrow picture, stays open for that picture; another folds it again", () => {
    animating();
    const view = render(<Stage fits={false} />);
    act(() => screen.getByRole("button", { name: "Show the small view" }).click());
    expect(screen.getByTestId("small view")).toBeInTheDocument();
    view.rerender(<Stage />);
    view.rerender(<Stage fits={false} />);
    expect(screen.getByTestId("small view")).toBeInTheDocument();
    view.rerender(<Stage fits={false} picture="ana/screen" />);
    expect(screen.queryByTestId("small view")).not.toBeInTheDocument();
  });

  it("stays folded where Hide folded it, however wide the picture", () => {
    const { end } = animating();
    const view = render(<Stage fits={false} />);
    act(() => screen.getByRole("button", { name: "Show the small view" }).click());
    act(() => screen.getByRole("button", { name: "Hide the small view" }).click());
    act(() => end(1));
    view.rerender(<Stage />);
    expect(screen.queryByTestId("small view")).not.toBeInTheDocument();
  });
});
