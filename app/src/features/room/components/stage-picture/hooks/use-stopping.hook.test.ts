import { renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { useStopping } from "./use-stopping.hook";

it("is stopping once a stream's video has played and gone, not while it starts", () => {
  const { result, rerender } = renderHook(({ key, has }) => useStopping(key, has), {
    initialProps: { key: "user-2:screen", has: false },
  });
  expect(result.current).toBe(false);
  rerender({ key: "user-2:screen", has: true });
  expect(result.current).toBe(false);
  rerender({ key: "user-2:screen", has: false });
  expect(result.current).toBe(true);
  rerender({ key: "user-3:screen", has: false });
  expect(result.current).toBe(false);
});
