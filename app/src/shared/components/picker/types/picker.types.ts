import type { ReactNode, RefObject } from "react";
import type { PickerOption } from "@shared/types/picker-option.types";

export interface PickerProps<T extends string> {
  /** Its name for screen readers; the pill reads "<label>: <chosen>". */
  label: string;
  options: readonly PickerOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /**
   * Down, floating over its panel in the pill's own see-through colour, or upward over the video, in
   * the pill's glass. Either way nothing moves when it opens.
   */
  opens?: "down" | "up";
  look?: "panel" | "glass";
  disabled?: boolean | undefined;
  /** Whether the list is open, for a picker told from outside; without it, the picker keeps its own. */
  open?: boolean | undefined;
  /** Told when the list opens or closes. */
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** The request it's cued for. The ring goes round the pill and its open list together. */
  cue?: number | undefined;
  /** Shown in the pill before its arrow: the mic's live level. */
  adornment?: ReactNode;
}

export type Masked = HTMLElement | SVGElement;

export interface MaskOptions {
  root: RefObject<HTMLElement | null>;
  list: RefObject<HTMLElement | null>;
  open: boolean;
  drawn: boolean;
  down: boolean;
}

export interface ListSizeState {
  open: boolean;
  drawn: boolean;
  up: boolean;
}

export interface PickerKeysState {
  open: boolean;
  up: boolean;
  setOpen: (open: boolean) => void;
}
