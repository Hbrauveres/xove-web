import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { loadAmbilight, saveAmbilight } from "@services/preferences-service";
import { useAmbilight } from "./use-ambilight.hook";

describe("the ambilight's settings", () => {
  it("starts from what was chosen last time", () => {
    saveAmbilight({ on: false, brightness: 0.4 });
    expect(renderHook(() => useAmbilight()).result.current[0]).toEqual({ on: false, brightness: 0.4 });
  });

  it("takes a change at once and remembers it", () => {
    const hook = renderHook(() => useAmbilight());
    act(() => hook.result.current[1]({ on: true, brightness: 0.85 }));
    expect(hook.result.current[0]).toEqual({ on: true, brightness: 0.85 });
    expect(loadAmbilight()).toEqual({ on: true, brightness: 0.85 });
  });
});
