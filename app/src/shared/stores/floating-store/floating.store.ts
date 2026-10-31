import type { Floating } from "./types/floating.types";

/**
 * What floats over the app, and the rules between them: one thing on screen at a time. What's inside
 * another belongs to it. While anything floats, one listener takes a press outside and Escape, before
 * the page's own handlers.
 */
export class FloatingStore {
  private showing: Floating[] = [];

  /** Something starts floating: whatever it replaces closes first. */
  add(floating: Floating) {
    const replaced = (other: Floating) =>
      other !== floating && !belongsTo(floating, other) && (floating.kind === "opened" || other.kind !== "opened");
    this.closeWhere(replaced);
    if (!this.showing.includes(floating)) this.showing.push(floating);
    if (this.showing.length === 1) this.listen();
  }

  remove(floating: Floating) {
    const had = this.showing.length > 0;
    this.showing = this.showing.filter((f) => f !== floating);
    if (had && this.showing.length === 0) this.stopListening();
  }

  /** Whether a mouse rest may open something: never over what the person opened themselves. */
  canRest(anchor?: Element | null) {
    return !this.showing.some((f) => f.kind === "opened" && !(anchor && f.area()?.contains(anchor)));
  }

  /** About to open on a rest: what's on the pointer's way closes at once, without its grace. */
  clearForRest(keep?: () => void, anchor?: Element | null) {
    this.closeWhere((f) => f.kind !== "opened" && f.close !== keep && !(anchor && f.area()?.contains(anchor)));
  }

  /** Only for tests: nothing floats, and nothing is closed on the way. */
  reset() {
    if (this.showing.length) this.stopListening();
    this.showing = [];
  }

  private closeWhere(test: (f: Floating) => boolean) {
    const closing = this.showing.filter(test);
    closing.forEach((f) => this.remove(f));
    closing.forEach((f) => f.close());
  }

  private readonly onPress = (e: Event) => {
    const target = e.target as Node;
    this.closeWhere((f) => f.kind !== "tooltip" && !f.area()?.contains(target) && !f.anchor?.()?.contains(target));
  };

  private readonly onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    // The innermost with a button to go back to: a slider inside a row closes with its row.
    const innermost = this.showing.filter((f) => f.kind !== "tooltip" && f.anchor?.()).at(-1);
    if (!innermost) return;
    e.preventDefault();
    e.stopPropagation();
    // Back to the button first: its focus could otherwise open it again.
    buttonIn(innermost.anchor?.())?.focus();
    this.closeWhere((f) => f === innermost);
  };

  private listen() {
    document.addEventListener("pointerdown", this.onPress, true);
    document.addEventListener("keydown", this.onKey, true);
  }

  private stopListening() {
    document.removeEventListener("pointerdown", this.onPress, true);
    document.removeEventListener("keydown", this.onKey, true);
  }
}

/** What takes the focus back: the anchor, or the button inside its wrapper. */
function buttonIn(anchor: HTMLElement | null | undefined) {
  return anchor?.querySelector<HTMLElement>("button") ?? anchor;
}

/** Whether `inner` shows inside `outer`, by its button or its own area. */
function belongsTo(inner: Floating, outer: Floating) {
  const area = outer.area();
  const [anchor, own] = [inner.anchor?.(), inner.area()];
  return Boolean(area && ((anchor && area.contains(anchor)) || (own && area.contains(own))));
}

/** The app's one store of what floats. */
export const floatingStore = new FloatingStore();
