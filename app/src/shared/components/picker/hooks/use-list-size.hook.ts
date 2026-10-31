import { useLayoutEffect, type RefObject } from "react";
import type { ListSizeState } from "../types/picker.types";
import { fitUpward } from "../utils/fit-upward.util";

/** Fits an upward list; the cue's ring reaches over the open list: the list's height, while drawn. */
export function useListSize(
  root: RefObject<HTMLElement | null>,
  list: RefObject<HTMLElement | null>,
  { open, drawn, up }: ListSizeState,
) {
  useLayoutEffect(() => {
    if (open && up && list.current) fitUpward(list.current, root.current);
  }, [open, up, root, list]);
  useLayoutEffect(() => {
    const h = open && list.current ? list.current.offsetHeight : 0;
    root.current?.style.setProperty("--list-h", `${h}px`);
  }, [open, drawn, root, list]);
}
