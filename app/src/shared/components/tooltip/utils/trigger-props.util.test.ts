import { expect, it, vi } from "vitest";
import { triggerProps } from "./trigger-props.util";

const actions = (text?: string) => ({
  id: "tip",
  text,
  hidden: false,
  rest: vi.fn(),
  show: vi.fn(),
  hide: vi.fn(),
});

it("describes its control, unless it only repeats the control's name", () => {
  expect(triggerProps({}, actions("Camera"))["aria-describedby"]).toBe("tip");
  expect(triggerProps({ "aria-label": "Camera" }, actions("Camera"))["aria-describedby"]).toBeUndefined();
});
