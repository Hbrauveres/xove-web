import { act, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePreviewTray } from "../../../hooks/use-preview-tray.hook";
import { StagePreviewTray } from "./stage-preview-tray.component";
describe("the previews' tray", () => {
  it("shows the open preview's row on its own layer, and nothing while none is open", () => {
    const hook = renderHook(() => usePreviewTray());
    const { rerender } = render(<StagePreviewTray tray={hook.result.current} render={(id) => <p>Row of {id}</p>} />);
    expect(screen.queryByText(/Row of/)).not.toBeInTheDocument();
    const anchor = document.createElement("li");
    document.body.append(anchor);
    act(() => hook.result.current.show({ id: "user-2", anchor, picture: anchor }));
    rerender(<StagePreviewTray tray={hook.result.current} render={(id) => <p>Row of {id}</p>} />);
    expect(screen.getByText("Row of user-2")).toBeInTheDocument();
  });
});
