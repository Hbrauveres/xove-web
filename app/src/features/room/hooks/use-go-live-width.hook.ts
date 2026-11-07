import { createContext, useContext } from "react";

/** Offered by the picture's layer: Go live hands it its width (its words decide it), for the fold. */
export const GoLiveWidthContext = createContext<((width: number) => void) | null>(null);

/** Where Go live reports its width, or null outside a stage. */
export function useGoLiveWidth(): ((width: number) => void) | null {
  return useContext(GoLiveWidthContext);
}
