import { useEffect, type RefObject } from "react";
import { moveInMenu } from "../utils/move-in-menu.util";

/** While `active`, the arrow keys move through the menu's items. */
export function useMenuArrows(menu: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    const el = menu.current;
    if (!active || !el) return;
    const onKeyDown = (e: KeyboardEvent) => moveInMenu(el, e);
    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [menu, active]);
}
