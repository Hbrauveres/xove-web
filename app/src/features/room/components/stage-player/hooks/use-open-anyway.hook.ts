import { useState } from "react";

/**
 * Whether the small view was opened on a picture too narrow for it, so it stays open there. A picture
 * wide enough again forgets it: the next narrow one folds it by itself again.
 */
export function useOpenAnyway(fits: boolean) {
  const [openAnyway, setOpenAnyway] = useState(false);
  const [fitted, setFitted] = useState(fits);
  if (fitted !== fits) {
    setFitted(fits);
    if (fits) setOpenAnyway(false);
  }
  return [openAnyway, setOpenAnyway] as const;
}
