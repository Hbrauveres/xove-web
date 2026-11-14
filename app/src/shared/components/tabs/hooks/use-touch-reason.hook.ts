import { createElement, useCallback, useRef, type PointerEvent } from "react";
import { Icon } from "@shared/components/icon";
import { toastStore } from "@shared/stores/toast-store";
import type { IconName } from "@shared/types/icon.types";
import { ICON_SIZE } from "../constants/tabs.constants";

/**
 * A finger has no tooltip: a tap on something that can't be used says why in a toast. Remembers
 * the last pointer's kind, so a mouse's click says nothing (its tooltip already did).
 */
export function useTouchReason() {
  const pointer = useRef("mouse");
  const onPointerDown = useCallback((e: PointerEvent) => {
    pointer.current = e.pointerType;
  }, []);
  const sayWhy = useCallback((reason: string, icon: IconName) => {
    if (pointer.current === "touch" || pointer.current === "pen")
      toastStore.show(reason, createElement(Icon, { name: icon, size: ICON_SIZE }));
  }, []);
  return { onPointerDown, sayWhy };
}
