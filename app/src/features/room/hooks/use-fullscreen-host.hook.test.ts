import { act, renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { useFullscreenHost } from "./use-fullscreen-host.hook";

it("keeps its windows in the page, and moves them into the player while it's fullscreen", () => {
  const page = { fullscreen: null as Element | null };
  Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => page.fullscreen });
  const { result, unmount } = renderHook(() => useFullscreenHost());
  expect(result.current.parentElement).toBe(document.body);
  const player = document.body.appendChild(document.createElement("div"));
  page.fullscreen = player;
  act(() => {
    document.dispatchEvent(new Event("fullscreenchange"));
  });
  expect(result.current.parentElement).toBe(player);
  unmount();
  expect(player.children).toHaveLength(0);
});
