import { HALF } from "../../../../constants/math.constants";
import { ROW_GAP } from "../constants/stage-player.constants";

/**
 * Where the settings open: centred on the cog (`--cog-x`, from the player's left) and just above
 * the row of buttons (`--above-row`, from the player's bottom), in px.
 */
export function settingsPlace(
  player: DOMRect,
  cog: DOMRect,
  row: DOMRect,
): { "--cog-x": string; "--above-row": string } {
  return {
    "--cog-x": `${cog.left + cog.width * HALF - player.left}px`,
    "--above-row": `${player.bottom - row.top + ROW_GAP}px`,
  };
}
