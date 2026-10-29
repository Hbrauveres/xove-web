import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCameraSwitch } from "./use-camera-switch.hook";

describe("picking another camera", () => {
  it("switches the camera, then restarts the preview with it", async () => {
    const order: string[] = [];
    const pickOnVideo = vi.fn(async () => void order.push("pick"));
    const restartPreview = vi.fn(async () => void order.push("restart"));
    const camera = { quality: "720p", mode: "smooth" } as const;
    const hook = renderHook(() => useCameraSwitch({ pickOnVideo, camera, restartPreview }));

    await act(async () => hook.result.current("cam-2"));

    expect(pickOnVideo).toHaveBeenCalledWith("cam-2", camera);
    expect(order).toEqual(["pick", "restart"]);
  });

  it("gives the same function while nothing changes", () => {
    const camera = { quality: "720p", mode: "smooth" } as const;
    const inputs = { pickOnVideo: vi.fn(), camera, restartPreview: vi.fn() };
    const hook = renderHook(() => useCameraSwitch(inputs));
    const before = hook.result.current;
    hook.rerender();
    expect(hook.result.current).toBe(before);
  });
});
