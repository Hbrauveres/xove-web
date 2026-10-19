import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TIP_REST_MS, Tooltip } from "./Tooltip";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const shown = () => document.querySelector('[role="tooltip"][data-shown]');

function setup(props: { text?: string; hidden?: boolean } = {}) {
  render(
    <div>
      <Tooltip text="Turn on your camera" {...props}>
        <button>Camera</button>
      </Tooltip>
      <Tooltip text="Settings">
        <button>Cog</button>
      </Tooltip>
    </div>,
  );
  return { camera: screen.getByRole("button", { name: "Camera" }), cog: screen.getByRole("button", { name: "Cog" }) };
}

describe("the app's one tooltip (spec 0133)", () => {
  it("shows after a short rest of the mouse, and goes the moment it leaves", () => {
    const { camera } = setup();
    fireEvent.pointerEnter(camera, { pointerType: "mouse" });
    expect(shown()).toBeNull();
    act(() => vi.advanceTimersByTime(TIP_REST_MS));
    expect(shown()).toHaveTextContent("Turn on your camera");
    expect(TIP_REST_MS).toBe(120);
    fireEvent.pointerLeave(camera, { pointerType: "mouse" });
    expect(shown()).toBeNull();
  });

  it("shows the next one at once while the pointer travels along a row", () => {
    const { camera, cog } = setup();
    fireEvent.pointerEnter(camera, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(TIP_REST_MS));
    fireEvent.pointerLeave(camera, { pointerType: "mouse" });
    fireEvent.pointerEnter(cog, { pointerType: "mouse" });
    expect(shown()).toHaveTextContent("Settings");
  });

  it("shows only one at a time", () => {
    const { camera, cog } = setup();
    fireEvent.pointerEnter(camera, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(TIP_REST_MS));
    fireEvent.pointerEnter(cog, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(TIP_REST_MS));
    expect(document.querySelectorAll('[role="tooltip"][data-shown]')).toHaveLength(1);
    expect(shown()).toHaveTextContent("Settings");
  });

  it("never shows by touch: a finger gets the toast instead", () => {
    const { camera } = setup();
    fireEvent.pointerEnter(camera, { pointerType: "touch" });
    act(() => vi.advanceTimersByTime(TIP_REST_MS * 3));
    expect(shown()).toBeNull();
  });

  it("goes when the control is pressed", () => {
    const { camera } = setup();
    fireEvent.pointerEnter(camera, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(TIP_REST_MS));
    fireEvent.pointerDown(camera, { pointerType: "mouse" });
    expect(shown()).toBeNull();
  });

  it("describes its control for screen readers, shown or not", () => {
    const { camera } = setup();
    expect(camera).toHaveAccessibleDescription("Turn on your camera");
  });

  it("keeps quiet when told to (a drop-up open over its control), still describing it for screen readers", () => {
    const quiet = setup({ hidden: true });
    fireEvent.pointerEnter(quiet.camera, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(TIP_REST_MS));
    expect(shown()).toBeNull();
    expect(quiet.camera).toHaveAccessibleDescription("Turn on your camera");
  });

  it("has nothing to say without text", () => {
    const { camera } = setup({ text: undefined });
    fireEvent.pointerEnter(camera, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(TIP_REST_MS));
    expect(shown()).toBeNull();
    expect(camera).not.toHaveAccessibleDescription();
  });
});
