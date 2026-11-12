import { gridKey } from "../../../../utils/light-grid.util";

/** Whether the controls are faded: only over a playing video; notices and the empty stage never fade. */
export function chromeState(playing: boolean, shown: boolean): "shown" | "hidden" | undefined {
  if (!playing) return undefined;
  return shown ? "shown" : "hidden";
}

/** A name for the stage light: another person, stream or grid starts a fresh light. */
export function lightKey(personId: string | null, kind: string | null, shape: number): string {
  return personId ? `${personId}|${kind}|${gridKey(shape)}` : "none";
}
