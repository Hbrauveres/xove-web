/** How something came to float: opened with a click or the keyboard, on a mouse rest, or a tooltip. */
export type FloatingKind = "opened" | "rest" | "tooltip";

export interface Floating {
  kind: FloatingKind;
  close: () => void;
  /** What it covers: a press here doesn't close it, and what shows here belongs to it. */
  area: () => Element | null;
  /** The button it belongs to: a press here is the button's, and Escape returns focus here. */
  anchor?: (() => HTMLElement | null) | undefined;
}

export type UseFloatingOptions = Omit<Floating, "close"> & { open: boolean; close: () => void };
