import { render, screen, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { aSharer } from "@testing/factories/sharer.factory";
import { usePreviewTray } from "../../../hooks/use-preview-tray.hook";
import { StageLivePreview } from "./stage-live-preview.component";
import userEvent from "@testing-library/user-event";
const setup = (sharer = aSharer({ name: "Ana", hasVoice: true })) => {
  const tray = renderHook(() => usePreviewTray()).result.current;
  const onPick = vi.fn();
  render(
    <ul>
      <StageLivePreview sharer={sharer} swapped={false} swapping={false} talking={false} tray={tray} onPick={onPick} />
    </ul>,
  );
  return { onPick };
};

describe("one small preview", () => {
  it("puts its person on the stage on a click", async () => {
    const { onPick } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Watch Ana · screen" }));
    expect(onPick).toHaveBeenCalledWith("user-7");
  });

  it("names its person and what's in front", () => {
    setup();
    expect(screen.getByText("Ana · screen")).toBeInTheDocument();
  });
});
