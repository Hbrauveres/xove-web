import type { ReactNode } from "react";
import { TOAST_MS } from "./constants/toast.constants";
import type { ToastMessage } from "./types/toast.types";

/**
 * A short message to the user: one at a time, the newest replacing it, gone by itself after 3 s.
 * Any component can show one; the stage draws it.
 */
export class ToastStore {
  private message: ToastMessage | null = null;
  private count = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private readonly listeners = new Set<() => void>();

  readonly show = (text: string, icon?: ReactNode) => {
    this.message = { id: ++this.count, text, icon };
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.message = null;
      this.tell();
    }, TOAST_MS);
    this.tell();
  };

  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly current = () => this.message;

  /** Only for tests: back to how the page started, with no toast, no listener and the count at 0. */
  reset() {
    clearTimeout(this.timer);
    this.timer = undefined;
    this.message = null;
    this.count = 0;
    this.listeners.clear();
  }

  private tell() {
    this.listeners.forEach((l) => l());
  }
}

/** The app's one toast. */
export const toastStore = new ToastStore();
