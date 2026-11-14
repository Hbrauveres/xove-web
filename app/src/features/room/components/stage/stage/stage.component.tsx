import { useState } from "react";
import { useHearing } from "../../../hooks/use-hearing.hook";
import { StageInfo } from "../../stage-info/stage-info";
import { StagePlayer } from "../stage-player";
import { useVideoShape } from "./hooks/use-video-shape.hook";
import styles from "./stage.component.module.css";
import { SettingsPanel } from "../../settings/settings-panel";
import { useRoomSession } from "../../../stores/room-session";
import { shapeStyle } from "./utils/stage-look.util";

/**
 * Where the big stream plays: a box as wide as its column, in the picture's own shape (16:9 while
 * empty or loading), holding the player; under it, who's on it and the other streams. What I hear
 * from each person is the stage's, for the player and the row alike.
 */
export function Stage() {
  const { sharers, controls, stage, ambilight, watchers, others } = useRoomSession().stage;
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const shape = useVideoShape(video);
  const hearing = useHearing(sharers, stage.big?.person.id ?? null);
  return (
    <section className={styles.stage} aria-label="Shared screen">
      <div className={styles.box} style={shapeStyle(shape)}>
        <StagePlayer
          sharers={sharers}
          controls={controls}
          stage={stage}
          hearing={hearing}
          ambilight={ambilight}
          shape={shape}
          video={video}
          onVideo={setVideo}
          settingsPanel={<SettingsPanel />}
        />
      </div>
      <StageInfo
        sharers={sharers}
        stage={stage}
        hearing={hearing}
        places={controls.places}
        free={controls.free}
        watchers={watchers}
        here={others}
        meTalking={controls.speaking}
      />
    </section>
  );
}
