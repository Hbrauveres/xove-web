import { AlsoLive } from "../../../../components/stage/AlsoLive";
import { NowWatching } from "../../../../components/stage/NowWatching";
import { STREAM_PLACES } from "../../constants/room.constants";
import styles from "./stage-info.component.module.css";
import type { StageInfoProps } from "./types/stage-info.types";

/** Under the stage, like YouTube's title row: who's on it at the left, the other streams at the right. */
export function StageInfo({ sharers, stage, hearing, free, watchers, here }: StageInfoProps) {
  const { big, pick, swappedFor, toggleSwap } = stage;
  return (
    <div className={styles.info}>
      <NowWatching sharer={big} {...(watchers ? { watchers } : {})} {...(here ? { others: here } : {})} />
      <AlsoLive
        others={sharers.filter((s) => s !== big)}
        liveCount={STREAM_PLACES - free}
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
