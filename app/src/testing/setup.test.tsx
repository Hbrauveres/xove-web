import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { tv } from "../components/stage/staticBands";
import { claimFloating } from "../components/ui/floating";
import { currentToast, showToast } from "../components/ui/toast";
import { TIP_REST_MS, Tooltip } from "@shared/components/tooltip";
import { fakeCameras, fakeMics, rooms } from "./fakeLiveKit";

// Each pair: the first test leaves something behind, the second finds it gone. The pairs run in
// their written order, so the reset is what the second one proves; in the other order both pass
// trivially, which is the point: no test depends on another.

describe("after every test, the page is clean", { shuffle: false }, () => {
  it("1. leaves a rendered page", () => {
    render(<p>Left behind</p>);
  });
  it("2. finds an empty page", () => {
    expect(document.body).toBeEmptyDOMElement();
  });
});

describe("after every test, storage and cookies are clear", { shuffle: false }, () => {
  it("1. leaves an item in each storage, and a cookie", () => {
    localStorage.setItem("xove.left", "1");
    sessionStorage.setItem("xove.left", "1");
    document.cookie = "XSRF-TOKEN=left";
  });
  it("2. finds them empty", () => {
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(document.cookie).toBe("");
  });
});

describe("after every test, spies, globals, variables and timers are put back", { shuffle: false }, () => {
  it("1. leaves a spy, a stubbed global, a stubbed variable and fake timers", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    vi.stubGlobal("leftBehind", true);
    vi.stubEnv("VITE_LEFT", "1");
    vi.useFakeTimers();
  });
  it("2. finds the real ones", () => {
    expect(vi.isMockFunction(Math.random)).toBe(false);
    expect("leftBehind" in globalThis).toBe(false);
    expect(import.meta.env.VITE_LEFT).toBeUndefined();
    expect(vi.isFakeTimers()).toBe(false);
  });
});

describe("after every test, the app's shared pieces are reset", { shuffle: false }, () => {
  it("1. leaves a toast, something floating and the TV on", () => {
    vi.useFakeTimers();
    showToast("Left behind");
    claimFloating(() => {
      throw new Error("a closed piece from an earlier test was closed again");
    });
    tv.on = true;
  });
  it("2. finds no toast, nothing floating, and the TV off", () => {
    expect(currentToast()).toBeNull();
    expect(() => claimFloating(() => {})).not.toThrow();
    expect(tv.on).toBe(false);
  });
});

const twoTips = () =>
  render(
    <div>
      <Tooltip text="First">
        <button>A</button>
      </Tooltip>
      <Tooltip text="Second">
        <button>B</button>
      </Tooltip>
    </div>,
  );

describe("after every test, the tooltip is cold", { shuffle: false }, () => {
  it("1. leaves it warm: one just hid", () => {
    vi.useFakeTimers();
    twoTips();
    const a = screen.getByRole("button", { name: "A" });
    fireEvent.pointerEnter(a, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(TIP_REST_MS));
    fireEvent.pointerLeave(a, { pointerType: "mouse" });
  });
  it("2. finds it waiting for a rest again", () => {
    vi.useFakeTimers();
    twoTips();
    fireEvent.pointerEnter(screen.getByRole("button", { name: "B" }), { pointerType: "mouse" });
    expect(document.querySelector('[role="tooltip"][data-shown]')).toBeNull();
  });
});

describe("after every test, the fake LiveKit is new", { shuffle: false }, () => {
  it("1. leaves a room and a camera unplugged", () => {
    rooms.push({} as (typeof rooms)[number]);
    fakeCameras.pop();
    fakeMics[0].label = "Changed";
  });
  it("2. finds no room, and the browser's devices as they were", () => {
    expect(rooms).toHaveLength(0);
    expect(fakeCameras.map((c) => c.deviceId)).toEqual(["cam-1", "cam-2"]);
    expect(fakeMics[0].label).toBe("Headset (USB)");
  });
});

describe("after every test, the browser's stand-ins are as setup made them", { shuffle: false }, () => {
  it("1. leaves a phone's media queries and a fullscreen page", () => {
    window.matchMedia = ((query: string) => ({ matches: true, media: query })) as never;
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => document.body });
    document.exitFullscreen = async () => {};
  });
  it("2. finds a desktop window and no fullscreen", () => {
    expect(window.matchMedia("(pointer: coarse)").matches).toBe(false);
    expect(document.fullscreenElement).toBeUndefined();
    expect("exitFullscreen" in document).toBe(false);
  });
});
