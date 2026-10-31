/** Whether the focus came from the keyboard; a click's focus doesn't count. */
export function isKeyboardFocus(target: EventTarget) {
  try {
    return target instanceof Element && target.matches(":focus-visible");
  } catch {
    return false;
  }
}
