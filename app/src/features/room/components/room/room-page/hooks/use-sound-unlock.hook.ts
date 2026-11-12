import { useEffect } from "react";

/**
 * Browsers block sound that starts without a click on the page: a viewer who came in from the
 * login never clicked, so the first click or key on the page calls `unlock`.
 */
export function useSoundUnlock(unlock: () => void): void {
  useEffect(() => {
    document.addEventListener("pointerup", unlock);
    document.addEventListener("keydown", unlock);
    return () => {
      document.removeEventListener("pointerup", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, [unlock]);
}
