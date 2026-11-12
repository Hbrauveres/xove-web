import { useCallback, useState } from "react";
import type { FacecamPlace } from "../../../types/facecam.types";
import { StageCornerGlow } from "../stage-corner-glow";
import { StageEmptyStage } from "../stage-empty-stage";
import { StageLight } from "../stage-light";
import { StagePicture } from "../stage-picture";
import { StageStaticGlow } from "../stage-static-glow";
import { FACECAM_START } from "./constants/stage-view.constants";
import styles from "./stage-view.component.module.css";
import type { StageViewProps } from "./types/stage-view.types";

/**
 * The picture in its own shape, centred, with its light behind it, stretched past it; or, with
 * nobody live, the TV on standby, its corners and static lighting the wall. The small view keeps its
 * place for the visit, and the TV turns on only the first time it stands by.
 */
export function StageView(props: StageViewProps) {
  const { big, main, small, sound, ambilight, shape, lightKey, video, onVideo, onSwap } = props;
  const [place, setPlace] = useState<FacecamPlace>(FACECAM_START);
  // Whether the TV has turned on in this visit: only the first time the stage stands by.
  const [tvOn, setTvOn] = useState(false);
  const turnTvOn = useCallback(() => setTvOn(true), []);

  return (
    <div className={styles.view}>
      {/* Behind the picture, outside it: the picture clips what's inside it. */}
      {!big && <StageCornerGlow prefs={ambilight} />}
      {!big && <StageStaticGlow prefs={ambilight} turnOn={!tvOn} />}
      <StageLight key={lightKey} video={big ? video : null} prefs={ambilight} shape={shape} />
      <div className={styles.picture}>
        {big && main ? (
          <StagePicture
            big={big}
            main={main}
            small={small}
            sound={sound}
            facecamPlace={place}
            onFacecamMove={setPlace}
            fold={props.fold}
            onSwap={onSwap}
            onVideo={onVideo}
          />
        ) : (
          <StageEmptyStage
            canShareScreen={props.canShareScreen}
            onStart={props.onStart}
            turnOn={!tvOn}
            onStandby={turnTvOn}
          />
        )}
      </div>
    </div>
  );
}
