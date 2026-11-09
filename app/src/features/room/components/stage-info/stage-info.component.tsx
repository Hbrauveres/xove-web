import { StageAlsoLive } from "../stage-also-live";
import { StageNowWatching } from "../stage-now-watching";
import styles from "./stage-info.component.module.css";
import type { StageInfoProps } from "./types/stage-info.types";

/** Under the stage, like YouTube's title row: who's on it at the left, the other streams at the right. */
export function StageInfo({ sharers, stage, hearing, places, free, watchers, here, meTalking }: StageInfoProps) {
  const { big, pick, swappedFor, toggleSwap } = stage;
  return (
    <div className={styles.info}>
      <StageNowWatching
        sharer={big}
        talking={Boolean(big?.isMe && meTalking)}
        {...(watchers ? { watchers } : {})}
        {...(here ? { others: here } : {})}
      />
      <StageAlsoLive
        others={sharers.filter((s) => s !== big)}
        liveCount={places - free}
        places={places}
        free={free}
        onPick={pick}
        hearOf={hearing.hearOf}
        onHear={hearing.setHear}
        swappedOf={(id) => Boolean(swappedFor[id])}
        onSwap={toggleSwap}
      />
    </div>
  );
}
