import type { ReactNode, TextareaHTMLAttributes } from "react";

export interface FieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> {
  /** What it asks for; starts exactly at the box's border. */
  label: string;
  /** A quiet word after the label, such as "(optional)". */
  hint?: string | undefined;
  value: string;
  onChange: (value: string) => void;
  /** What sits at the end of the row under the box (its form's button). */
  action?: ReactNode;
}
