import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StageStreamQuick } from "./stage-stream-quick.component";

const props = (over = {}) => ({
  kind: "screen" as const,
  cameras: [],
  camera: null,
  busy: false,
  listOpen: false,
  onListOpen: vi.fn(),
  onChangeWindow: vi.fn(),
  onPickCamera: vi.fn(),
  ...over,
});

describe("a live stream's quick access", () => {
  it("for the screen, says what's shared and changes it", async () => {
    const p = props({ screenSurface: "browser" });
    render(<StageStreamQuick {...p} />);
    expect(screen.getByText("A tab")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Change" }));
    expect(p.onChangeWindow).toHaveBeenCalledOnce();
  });

  it("for the camera, lists the cameras", () => {
    render(
      <StageStreamQuick {...props({ kind: "camera", cameras: [{ deviceId: "c1", label: "Front" }], camera: "c1" })} />,
    );
    expect(screen.getByRole("button", { name: /Camera/ })).toHaveTextContent("Front");
  });
});
