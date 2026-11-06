import { useCallback, useMemo, useRef, type FocusEvent, type KeyboardEvent } from "react";
import { floatingStore } from "@shared/stores/floating-store";
import { useKeyboardLast } from "../../../hooks/use-keyboard-last.hook";
import type { PreviewTray } from "../../../types/preview-tray.types";

/**
 * A preview's way to its row: pointing at the preview (or the keyboard's focus) opens it, unless the
 * preview can't have one or something else is open; Tab from the preview goes into the open row.
 * The hook holds the preview's own element and its picture's.
 */
export function usePreviewRow(id: string, canOpen: boolean, tray: PreviewTray) {
  const keyboardLast = useKeyboardLast();
  const item = useRef<HTMLLIElement>(null);
  const picture = useRef<HTMLSpanElement>(null);
  const { show, leave, blurred, enterRow } = tray;
  const isOpen = tray.open?.id === id;
  const open = useCallback(() => {
    if (canOpen && floatingStore.canRest() && item.current && picture.current)
      show({ id, anchor: item.current, picture: picture.current });
  }, [canOpen, id, show]);
  return useMemo(
    () => ({
      item,
      picture,
      isOpen,
      onPointerEnter: open,
      onPointerLeave: leave,
      onFocus: () => keyboardLast() && open(),
      onBlur: (e: FocusEvent) => blurred(e.relatedTarget instanceof Node ? e.relatedTarget : null),
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === "Tab" && !e.shiftKey && isOpen && enterRow()) e.preventDefault();
      },
    }),
    [open, leave, keyboardLast, blurred, isOpen, enterRow],
  );
}
