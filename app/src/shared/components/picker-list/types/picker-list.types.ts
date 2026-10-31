import type { Ref } from "react";
import type { PickerOption } from "@shared/types/picker-option.types";

export interface PickerListProps<T extends string = string> {
  ref: Ref<HTMLDivElement>;
  id: string;
  label: string;
  options: readonly PickerOption<T>[];
  open: boolean;
  unrolled: boolean;
  /** Opens upward: the nearest option is the last. */
  up: boolean;
  onPick: (value: T) => void;
}
