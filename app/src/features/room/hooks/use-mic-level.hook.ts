import { useEffect, useState } from "react";
import { startMicMeter } from "@core/devices/mic-meter.util";

/** My mic's live level, 0 to 1, read only while `on` (the Voice tab open). 0 where the browser can't read it. */
export function useMicLevel(input: MediaStreamTrack | undefined, on: boolean): number {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    const stop = on && input ? startMicMeter(input, setLevel) : null;
    return () => {
      stop?.();
      setLevel(0);
    };
  }, [input, on]);
  return on && input ? level : 0;
}
