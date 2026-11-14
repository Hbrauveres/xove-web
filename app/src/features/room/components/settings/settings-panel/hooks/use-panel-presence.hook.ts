import { useEffect, useState } from "react";
import { PANEL_MS } from "../constants/settings-panel.constants";

/**
 * The panel's presence: in the page while open and for its slide out after (`present`), and drawn
 * in (`shown`) from the frame after it opens, so it slides in; closing slides it out at once.
 */
export function usePanelPresence(open: boolean) {
  const [gone, setGone] = useState(!open);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    if (open) {
      const next = requestAnimationFrame(() => {
        setGone(false);
        setDrawn(true);
      });
      return () => cancelAnimationFrame(next);
    }
    const leave = window.setTimeout(() => {
      setGone(true);
      setDrawn(false);
    }, PANEL_MS);
    return () => window.clearTimeout(leave);
  }, [open]);
  return { present: open || !gone, shown: open && drawn };
}
