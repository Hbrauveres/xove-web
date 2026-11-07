import type { usePreviewTray } from "../hooks/use-preview-tray.hook";

/** A preview whose row is open: whose, the preview itself, and its picture (the row is its width). */
export type OpenRow = { id: string; anchor: HTMLElement; picture: HTMLElement };

/** One row on the tray's layer: the open one, or one rolling back. */
export type TrayLayer = { open: OpenRow; leaving: boolean };

/** The previews' row, as `usePreviewTray` hands it out. */
export type PreviewTray = ReturnType<typeof usePreviewTray>;
