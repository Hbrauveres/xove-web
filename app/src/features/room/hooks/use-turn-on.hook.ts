import { useCallback, useState } from "react";
import { reducedMotion } from "@shared/utils/reduced-motion.util";
import type { TurnOn } from "../types/turn-on.types";

/**
 * The TV turning on: shown when the stage asks for it (the first time it stands by in a visit),
 * never for reduced motion, until its animation ends. Decided once, when the piece appears.
 */
export function useTurnOn(turnOn: boolean): TurnOn {
  const [turningOn, setTurningOn] = useState(() => turnOn && !reducedMotion());
  const ended = useCallback(() => setTurningOn(false), []);
  return { turningOn, ended };
}
