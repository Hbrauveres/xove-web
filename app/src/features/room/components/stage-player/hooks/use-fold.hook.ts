import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { reducedMotion } from "@shared/utils/reduced-motion.util";
import type { SmallViewFold } from "../../../types/small-view.types";
import { FOLD_EASE, FOLD_MS } from "../constants/stage-player.constants";
import { useOpenAnyway } from "./use-open-anyway.hook";
import { foldFrames } from "../utils/fold-frames.util";

/**
 * The small view's fold. Hide moves its box onto the corner button and shrinks it there, then folds
 * it; the focus goes to the corner button. The corner button opens it again: it grows back out of the
 * corner, and the focus goes back to Hide. With less motion asked for (or a browser that can't
 * animate an element), it just folds and opens.
 *
 * On a picture too narrow for it (`fits` false) it folds by itself, quietly: no move, no focus. Opened
 * from the corner there, it stays open for that picture, until the picture is wide enough again.
 */
export function useFold(fits = true): SmallViewFold {
  const [hidden, setHidden] = useState(false);
  const [openAnyway, setOpenAnyway] = useOpenAnyway(fits);
  const folded = hidden || (!fits && !openAnyway);
  const box = useRef<HTMLElement | null>(null);
  const hideButton = useRef<HTMLElement | null>(null);
  const corner = useRef<HTMLElement | null>(null);
  // What the last change was: the focus and the move follow it, once.
  const changed = useRef<"hid" | "showed" | null>(null);
  const hide = useCallback(() => {
    const from = box.current;
    const to = corner.current;
    const fold = () => {
      changed.current = "hid";
      setHidden(true);
      setOpenAnyway(false);
    };
    if (!from || !to || typeof from.animate !== "function" || reducedMotion()) return fold();
    const move = from.animate(foldFrames(from.getBoundingClientRect(), to.getBoundingClientRect()), {
      duration: FOLD_MS,
      easing: FOLD_EASE,
      fill: "forwards",
    });
    move.onfinish = fold;
  }, [setOpenAnyway]);
  const show = useCallback(() => {
    changed.current = "showed";
    setHidden(false);
    if (!fits) setOpenAnyway(true);
  }, [fits, setOpenAnyway]);
  useLayoutEffect(() => {
    const was = changed.current;
    changed.current = null;
    if (was === "hid") corner.current?.focus();
    if (was !== "showed") return;
    hideButton.current?.focus();
    const el = box.current;
    const from = corner.current;
    if (!el || !from || typeof el.animate !== "function" || reducedMotion()) return;
    el.animate(foldFrames(el.getBoundingClientRect(), from.getBoundingClientRect()).reverse(), {
      duration: FOLD_MS,
      easing: FOLD_EASE,
    });
  }, [folded]);
  const setBox = useCallback((el: HTMLElement | null) => {
    box.current = el;
  }, []);
  const setHide = useCallback((el: HTMLElement | null) => {
    hideButton.current = el;
  }, []);
  const setCorner = useCallback((el: HTMLElement | null) => {
    corner.current = el;
  }, []);
  return useMemo(
    () => ({ folded, hide, show, setBox, setHide, setCorner }),
    [folded, hide, show, setBox, setHide, setCorner],
  );
}
