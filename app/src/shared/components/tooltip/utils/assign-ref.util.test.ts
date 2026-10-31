import { describe, expect, it, vi } from "vitest";
import { assignRef } from "./assign-ref.util";

describe("handing an element to a ref", () => {
  it("calls a function ref, sets an object ref, and ignores none", () => {
    const el = {} as HTMLElement;
    const fn = vi.fn();
    assignRef(fn, el);
    expect(fn).toHaveBeenCalledWith(el);
    const object = { current: null as HTMLElement | null };
    assignRef(object, el);
    expect(object.current).toBe(el);
    expect(() => assignRef(undefined, el)).not.toThrow();
  });
});
