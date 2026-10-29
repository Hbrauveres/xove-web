import { useEffect, useRef } from "react";

/**
 * Whether the keyboard, not a press, came last: the keyboard's focus keeps controls up, but a click
 * leaves the focus on the button it pressed, and that mustn't keep them up for good.
 */
export function useKeyboardLast() {
  const pressed = useRef(false);
  useEffect(() => {
    const press = () => (pressed.current = true);
    const key = () => (pressed.current = false);
    document.addEventListener("pointerdown", press, true);
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("pointerdown", press, true);
      document.removeEventListener("keydown", key, true);
    };
  }, []);
  return () => !pressed.current;
}
