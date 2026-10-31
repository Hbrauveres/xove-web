import { useEffect, useState } from "react";
import { CLOSE_MS } from "../constants/picker.constants";

/** The list stays drawn while it rolls back, and unrolls a frame after it's drawn. */
export function useListRoll(open: boolean) {
  const [drawn, setDrawn] = useState(false);
  if (open && !drawn) setDrawn(true);
  useEffect(() => {
    if (open || !drawn) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const gone = window.setTimeout(() => setDrawn(false), reduce ? 0 : CLOSE_MS);
    return () => window.clearTimeout(gone);
  }, [open, drawn]);
  const [unrolled, setUnrolled] = useState(false);
  if (!open && unrolled) setUnrolled(false);
  useEffect(() => {
    if (!open) return;
    const next = requestAnimationFrame(() => setUnrolled(true));
    return () => cancelAnimationFrame(next);
  }, [open]);
  return { drawn, unrolled };
}
