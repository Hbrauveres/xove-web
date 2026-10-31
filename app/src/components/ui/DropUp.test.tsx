import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DropUp, LEAVE_GRACE_MS, OPEN_DELAY_MS } from "./DropUp";
import { TIP_REST_MS, Tooltip } from "@shared/components/tooltip";

/** Each test's own clock and pointer: fake timers, and a mouse that can hover. */
function onDevice() {
  const device = { hover: true };
  vi.useFakeTimers();
  vi.spyOn(window, "matchMedia").mockImplementation(
    (q: string) =>
      ({
        matches: q.includes("hover: hover") ? device.hover : false,
        media: q,
        addEventListener() {},
        removeEventListener() {},
      }) as unknown as MediaQueryList,
  );
  return { device };
}

function setup(props: Partial<Parameters<typeof DropUp>[0]> = {}) {
  const onLeave = vi.fn();
  render(
    <DropUp
      label="The window you share"
      enabled
      onLeave={onLeave}
      trigger={<button>Stop sharing your screen</button>}
      {...props}
    >
      <button>Change</button>
    </DropUp>,
  );
  const wrap = screen.getByRole("button", { name: "Stop sharing your screen" }).closest("[data-dropup]")!;
  const shown = () => wrap.getAttribute("data-open") === "true";
  return { wrap, shown, onLeave };
}

describe("DropUp, the quick-access pill over a live button", () => {
  it("opens a short pause after the pointer arrives, not at once", () => {
    onDevice();
    const { wrap, shown } = setup();
    fireEvent.pointerEnter(wrap);
    expect(shown()).toBe(false);
    act(() => vi.advanceTimersByTime(OPEN_DELAY_MS));
    expect(shown()).toBe(true);
    expect(OPEN_DELAY_MS).toBe(120);
  });

  it("closes at once when the pointer moves on to another live button: one at a time (spec 0133, #128)", () => {
    onDevice();
    render(
      <div>
        <DropUp label="The window you share" enabled trigger={<button>Stop sharing your screen</button>}>
          <button>Change</button>
        </DropUp>
        <DropUp label="Your camera" enabled trigger={<button>Turn off your camera</button>}>
          <button>Webcam C920</button>
        </DropUp>
      </div>,
    );
    const [screenUp, cameraUp] = ["Stop sharing your screen", "Turn off your camera"].map((name) =>
      screen.getByRole("button", { name }).closest("[data-dropup]")!,
    );
    fireEvent.pointerEnter(screenUp);
    act(() => vi.advanceTimersByTime(OPEN_DELAY_MS));
    expect(screenUp).toHaveAttribute("data-open", "true");

    // Straight to the camera, well within the screen's grace: the screen's closes now.
    fireEvent.pointerLeave(screenUp);
    fireEvent.pointerEnter(cameraUp);
    expect(screenUp).toHaveAttribute("data-open", "false");
    act(() => vi.advanceTimersByTime(OPEN_DELAY_MS));
    expect(cameraUp).toHaveAttribute("data-open", "true");
  });

  it("keeps open while a tooltip inside it shows, and closes when one outside shows (spec 0133)", () => {
    onDevice();
    render(
      <div>
        <DropUp label="Your camera" enabled trigger={<button>Turn off your camera</button>}>
          <Tooltip text="Webcam C920">
            <button>Camera: Webcam C920</button>
          </Tooltip>
        </DropUp>
        <Tooltip text="Settings">
          <button>Settings</button>
        </Tooltip>
      </div>,
    );
    const up = screen.getByRole("button", { name: "Turn off your camera" }).closest("[data-dropup]")!;
    fireEvent.pointerEnter(up);
    act(() => vi.advanceTimersByTime(OPEN_DELAY_MS));
    expect(up).toHaveAttribute("data-open", "true");

    // Its own picker's tooltip: part of it.
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Camera: Webcam C920" }), { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(TIP_REST_MS));
    expect(document.querySelector('[role="tooltip"][data-shown]')).toHaveTextContent("Webcam C920");
    expect(up).toHaveAttribute("data-open", "true");

    // Another control's tooltip: the drop-up goes.
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Settings" }), { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(TIP_REST_MS));
    expect(up).toHaveAttribute("data-open", "false");
  });

  it("opening closes a tooltip showing elsewhere (spec 0133)", () => {
    onDevice();
    render(
      <div>
        <DropUp label="Your camera" enabled trigger={<button>Turn off your camera</button>}>
          <button>Webcam C920</button>
        </DropUp>
        <Tooltip text="Settings">
          <button>Cog</button>
        </Tooltip>
      </div>,
    );
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Cog" }), { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(TIP_REST_MS));
    expect(document.querySelector('[role="tooltip"][data-shown]')).not.toBeNull();
    const up = screen.getByRole("button", { name: "Turn off your camera" }).closest("[data-dropup]")!;
    fireEvent.pointerEnter(up);
    expect(document.querySelector('[role="tooltip"][data-shown]')).toBeNull();
    act(() => vi.advanceTimersByTime(OPEN_DELAY_MS));
    expect(up).toHaveAttribute("data-open", "true");
  });

  it("forgives a slip outside shorter than the grace, and closes after it", () => {
    onDevice();
    const { wrap, shown, onLeave } = setup();
    fireEvent.pointerEnter(wrap);
    act(() => vi.advanceTimersByTime(OPEN_DELAY_MS));
    fireEvent.pointerLeave(wrap);
    act(() => vi.advanceTimersByTime(LEAVE_GRACE_MS - 50));
    fireEvent.pointerEnter(wrap);
    act(() => vi.advanceTimersByTime(LEAVE_GRACE_MS));
    expect(shown()).toBe(true);
    fireEvent.pointerLeave(wrap);
    act(() => vi.advanceTimersByTime(LEAVE_GRACE_MS));
    expect(shown()).toBe(false);
    expect(onLeave).toHaveBeenCalledOnce();
    expect(LEAVE_GRACE_MS).toBe(300);
  });

  it("closes when the pointer leaves even right after a click inside", () => {
    onDevice();
    const { wrap, shown } = setup();
    fireEvent.pointerEnter(wrap);
    act(() => vi.advanceTimersByTime(OPEN_DELAY_MS));
    screen.getByRole("button", { name: "Change" }).focus();
    fireEvent.click(screen.getByRole("button", { name: "Change" }));
    fireEvent.pointerLeave(wrap);
    act(() => vi.advanceTimersByTime(LEAVE_GRACE_MS));
    expect(shown()).toBe(false);
  });

  it("opens for the keyboard's focus, and closes with Escape", () => {
    onDevice();
    const { wrap, shown } = setup();
    const trigger = screen.getByRole("button", { name: "Stop sharing your screen" });
    vi.spyOn(trigger, "matches").mockReturnValue(true);
    fireEvent.focus(trigger);
    expect(shown()).toBe(true);
    fireEvent.keyDown(wrap, { key: "Escape" });
    expect(shown()).toBe(false);
  });

  it("is out of reach while closed", () => {
    onDevice();
    setup();
    expect(document.querySelector("[data-dropup] [role=group]")).toHaveAttribute("inert");
  });

  it("keeps its button, and the keyboard's focus on it, when the stream starts or stops", () => {
    onDevice();
    const view = render(
      <DropUp label="x" enabled={false} trigger={<button>Turn on your camera</button>}>
        <button>Change</button>
      </DropUp>,
    );
    const button = screen.getByRole("button", { name: "Turn on your camera" });
    button.focus();
    view.rerender(
      <DropUp label="x" enabled trigger={<button>Turn on your camera</button>}>
        <button>Change</button>
      </DropUp>,
    );
    expect(screen.getByRole("button", { name: "Turn on your camera" })).toBe(button);
    expect(button).toHaveFocus();
  });

  it("isn't there while the stream is off", () => {
    onDevice();
    render(
      <DropUp label="x" enabled={false} trigger={<button>a</button>}>
        <button>Change</button>
      </DropUp>,
    );
    expect(screen.queryByRole("button", { name: "Change" })).not.toBeInTheDocument();
  });
});

describe("DropUp redirected: another panel shows the setting (spec 0115)", () => {
  it("resting the mouse calls the redirect after the same pause, and nothing opens", () => {
    onDevice();
    const redirect = vi.fn();
    const { wrap, shown } = setup({ redirect });
    fireEvent.pointerEnter(wrap, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(OPEN_DELAY_MS - 1));
    expect(redirect).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(redirect).toHaveBeenCalledOnce();
    expect(shown()).toBe(false);
  });

  it("the keyboard's focus doesn't redirect, nor open it", () => {
    onDevice();
    const redirect = vi.fn();
    const { wrap, shown } = setup({ redirect });
    const button = wrap.querySelector("button")!;
    vi.spyOn(button, "matches").mockReturnValue(true);
    fireEvent.focus(button);
    expect(redirect).not.toHaveBeenCalled();
    expect(shown()).toBe(false);
  });
});
