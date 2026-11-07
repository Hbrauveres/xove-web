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
  /** The player's own: a move, a press or a focus shows them; leaving hides them. */
  handlers: {
    onPointerMove: () => void;
    onPointerDown: () => void;
    onFocus: () => void;
    onPointerLeave: (e: PointerEvent) => void;
  };
}
