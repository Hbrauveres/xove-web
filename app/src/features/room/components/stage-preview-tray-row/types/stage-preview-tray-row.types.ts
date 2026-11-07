import type { ReactNode } from "react";
import type { TrayLayer } from "../../../types/preview-tray.types";

/** Where the row sits: under its preview or above it, and its box, in px. */
export type RowPlace = { below: boolean; left: number; width: number; top?: number; bottom?: number };

export interface StagePreviewTrayRowProps {
  layer: TrayLayer;
  onGone: (id: string) => void;
  onEnter: () => void;
  onLeave: () => void;
  /** The open row's element, handed to the tray (a row rolling back hands nothing). */
  onElement: (el: HTMLElement | null) => void;
  children: ReactNode;
}

/** What a row's events tell: the pointer or focus came in, it should go, its roll-back ended. */
export type RowHandlers = { onEnter: () => void; onLeave: () => void; onRolledBack: () => void };
