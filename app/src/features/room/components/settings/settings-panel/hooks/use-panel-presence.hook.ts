import { useEffect, useState } from "react";
import { PANEL_MS } from "../constants/settings-panel.constants";

/**
 * The panel's presence: in the page while open and for its slide out after (`present`), and drawn
 * in (`shown`) from the frame after it arrives, so it slides in. What it was is remembered across
 * renders, the way React adjusts state when a prop changes.
 */
export function usePanelPresence(open: boolean) {
  const [present, setPresent] = useState(open);
  const [shown, setShown] = useState(false);
  if (open && !present) setPresent(true);
  if (!open && shown) setShown(false);
  useEffect(() => {
    if (open) {
      const next = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(next);
    }
    const gone = window.setTimeout(() => setPresent(false), PANEL_MS);
    return () => window.clearTimeout(gone);
  }, [open]);
  return { present, shown };
}
