import { CANT_REACH, FAILED, FAILED_LINE, GAVE_UP, TRYING_NOW } from "../constants/cant-reach.constants";
import type { CantReachProps } from "../types/cant-reach.types";
import type { PageView } from "../types/page-view.types";
import { secondsLeft } from "./seconds-left.util";

/** What the page shows for why it can't tell who's signed in, at `now`. */
export function pageView(state: CantReachProps["state"], now: number): PageView {
  if (state.status === "failed")
    return { headline: FAILED, line: FAILED_LINE, action: state.busy ? "pleaseWait" : "tryAgain" };
  if (state.nextTryAt === null) return { headline: CANT_REACH, line: GAVE_UP, action: "tryAgain" };
  const left = secondsLeft(state.nextTryAt, now);
  return { headline: CANT_REACH, line: left > 0 ? `Trying again in ${left} s.` : TRYING_NOW, action: "reconnecting" };
}
