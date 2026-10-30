import type { LabelHTMLAttributes, Ref } from "react";

export interface SwitchProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, "onToggle"> {
  /** What it turns on and off: shown beside it, and its name. */
  label: string;
  checked: boolean;
  onToggle: () => void;
  /** Can't be used here: greyed, and a click says why (the piece using it decides). */
  unavailable?: boolean | undefined;
  ref?: Ref<HTMLLabelElement> | undefined;
}
