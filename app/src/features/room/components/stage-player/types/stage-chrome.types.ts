import type { PointerEvent } from "react";

/** The player's labels and bars: shown while the mouse moves, faded when it rests. */
export interface StageChrome {
  shown: boolean;
  /** The mouse moved, or something was pressed or focused: show them, and start the idle timer again. */
  show: () => void;
  /** The pointer left the player. */
  leave: (e: PointerEvent) => void;
  /** Something open holds them up (a menu, the settings) until it closes. */
  hold: (what: string, open: boolean) => void;
  /** One of my buttons' menus opened or closed: it holds them up while open. */
  onMenuChange: (open: boolean) => void;
  /**
   * The player's own: a move, a press or a focus shows them; leaving hides them; a control under the
   * pointer keeps them.
   */
  handlers: {
    onPointerMove: () => void;
    onPointerDown: () => void;
    onFocus: () => void;
    onPointerLeave: (e: PointerEvent) => void;
    /** What the pointer is on now: resting on a control keeps them up. */
    onPointerOver: (e: PointerEvent) => void;
  };
}

/** What may keep the player's controls up, beside the player itself. */
export interface ChromeReasons {
  /** How many things hold them up (a menu, the settings). */
  held: number;
  /** The pointer rests on one of the controls. */
  onControl: boolean;
  /** The keyboard was used last (a click's focus doesn't count). */
  keyboard: boolean;
}
