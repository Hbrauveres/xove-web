import { GO_LIVE_GUESS, ROUND_M, UNMUTE_WIDTH } from "../constants/row-fold.constants";
import type { RowButton, RowItems, RowShape } from "../types/row-fold.types";

/**
 * The buttons on the picture, in the bar's order, with their widths: the M round buttons (or the
 * unmute pill in the sounds' place), Go live's pill as last measured (a guess before). My own row:
 * my screen, camera, mic and settings.
 */
export function rowItems(shape: RowShape, goLiveWidth: number | null): RowItems {
  if (shape.mine) return { own: 4 };
  if (shape.settingsOnly) return { viewer: [{ key: "settings", width: ROUND_M }] };
  const buttons: RowButton[] = [];
  // While the browser holds the sound, the unmute pill takes the sounds' place (it never folds).
  if (shape.held) buttons.push({ key: "unmute", width: UNMUTE_WIDTH });
  else {
    if (shape.sound) buttons.push({ key: "sound", width: ROUND_M });
    if (shape.voice) buttons.push({ key: "voice", width: ROUND_M });
  }
  buttons.push(shape.live ? { key: "mic", width: ROUND_M } : { key: "go-live", width: goLiveWidth ?? GO_LIVE_GUESS });
  return { viewer: buttons };
}
