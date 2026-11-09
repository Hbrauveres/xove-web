import { useEffect } from "react";
import { YOUR_TURN_TITLE } from "../constants/queue-seat-offer.constants";

/** While the offer shows, the tab's title says it's my turn; the old title comes back after. */
export function useTurnTitle(): void {
  useEffect(() => {
    const before = document.title;
    document.title = YOUR_TURN_TITLE;
    return () => {
      document.title = before;
    };
  }, []);
}
