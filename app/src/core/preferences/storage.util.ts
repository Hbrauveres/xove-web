/**
 * The browser's storage, for conveniences only: when it's blocked (private mode, a
 * browser setting), reading gives nothing and writing does nothing, so the defaults apply.
 */
export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* The choice just isn't remembered. */
  }
}
