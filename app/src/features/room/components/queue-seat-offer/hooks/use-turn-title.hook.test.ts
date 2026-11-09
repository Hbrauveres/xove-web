import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { YOUR_TURN_TITLE } from "../constants/queue-seat-offer.constants";
import { useTurnTitle } from "./use-turn-title.hook";

describe("the tab's title on my turn", () => {
  it("says it's my turn, and gives the old title back after", () => {
    document.title = "Xovê";
    const { unmount } = renderHook(() => useTurnTitle());
    expect(document.title).toBe(YOUR_TURN_TITLE);
    unmount();
    expect(document.title).toBe("Xovê");
  });
});
