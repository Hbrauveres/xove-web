import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useFloating } from "@shared/stores/floating-store";
import { StagePreviewTrayRow } from "../stage-preview-tray-row";
import { useTrayLayers } from "./hooks/use-tray-layers.hook";
import type { StagePreviewTrayProps } from "./types/stage-preview-tray.types";

/**
 * The previews' rows, floating over the page on their own layer, so the previews' scrolling strip
 * never clips them. Escape or a press elsewhere closes the open one; so does scrolling the previews
 * away, unless a slider is in use.
 */
export function StagePreviewTray({ tray, render }: StagePreviewTrayProps) {
  const { open, busy, leave, stay, close, setRow } = tray;
  const ref = useRef<HTMLDivElement>(null);
  const { layers, gone } = useTrayLayers(open);
  useFloating({
    open: open !== null,
    kind: "rest",
    close,
    area: () => ref.current,
    anchor: () => open?.anchor ?? null,
  });
  useEffect(() => {
    if (!open) return;
    const scrolled = (e: Event) => {
      if (!busy && !(e.target instanceof Node && ref.current?.contains(e.target))) close();
    };
    document.addEventListener("scroll", scrolled, true);
    return () => document.removeEventListener("scroll", scrolled, true);
  }, [open, busy, close]);
  if (!layers.length) return null;
  return createPortal(
    <div ref={ref}>
      {layers.map((l) => (
        <StagePreviewTrayRow key={l.open.id} layer={l} onGone={gone} onEnter={stay} onLeave={leave} onElement={setRow}>
          {render(l.open.id)}
        </StagePreviewTrayRow>
      ))}
    </div>,
    document.body,
  );
}
