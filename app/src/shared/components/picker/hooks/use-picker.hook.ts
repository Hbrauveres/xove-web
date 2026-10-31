import { useId, useRef } from "react";
import { useFloating } from "@shared/stores/floating-store";
import type { PickerProps } from "../types/picker.types";
import { useClosesOnChange } from "./use-closes-on-change.hook";
import { useListMask } from "./use-list-mask.hook";
import { useListRoll } from "./use-list-roll.hook";
import { useListSize } from "./use-list-size.hook";
import { usePickerKeys } from "./use-picker-keys.hook";
import { useToldOpen } from "./use-told-open.hook";

/** A picker's state and its parts together: what's open, what's chosen, what closes it. */
export function usePicker<T extends string>(props: PickerProps<T>, up: boolean) {
  const { options, value, onChange } = props;
  const { open, setOpen } = useToldOpen(props.open, props.onOpenChange);
  const { drawn, unrolled } = useListRoll(open);
  const root = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const listId = useId();
  const chosen = options.find((o) => o.value === value) ?? options[0];

  const floating = useFloating({
    open,
    kind: "opened",
    close: () => setOpen(false),
    area: () => root.current,
    anchor: () => pill.current,
  });
  useListMask({ root, list, open, drawn, down: !up });
  useListSize(root, list, { open, drawn, up });
  usePickerKeys(root, { open, up, setOpen });
  useClosesOnChange(floating.close, options.map((o) => o.value).join("|"), open);

  const pick = (next: T) => {
    setOpen(false);
    onChange(next);
    pill.current?.focus();
  };
  const others = options.filter((o) => o !== chosen);
  return { root, pill, list, listId, open, setOpen, drawn, unrolled, chosen, others, pick };
}
