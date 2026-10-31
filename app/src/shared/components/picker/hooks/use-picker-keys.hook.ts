import { useEffect, useRef, type RefObject } from "react";
import type { PickerKeysState } from "../types/picker.types";

/** The arrows: they open it, its option nearest the pill taking the focus, and move through the options. */
export function usePickerKeys(root: RefObject<HTMLElement | null>, { open, up, setOpen }: PickerKeysState) {
  const optionsIn = () => [...(root.current?.querySelectorAll<HTMLElement>("[role=menuitemradio]") ?? [])];
  const focusFirst = useRef(false);
  useEffect(() => {
    if (!open || !focusFirst.current) return;
    focusFirst.current = false;
    const all = optionsIn();
    // Without scrolling the list away from the pill.
    all.at(up ? -1 : 0)?.focus({ preventScroll: true });
  });
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const step = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      if (!open) {
        setOpen(true);
        focusFirst.current = true;
        return;
      }
      const all = optionsIn();
      const at = all.findIndex((option) => option === document.activeElement);
      all[Math.min(all.length - 1, Math.max(0, at + step))]?.focus();
    };
    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  });
}
