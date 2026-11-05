type SegmentOption<T extends string> = { value: T; label: string; title?: string };

export interface SegmentedProps<T extends string> {
  /** Its name for screen readers. */
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}
