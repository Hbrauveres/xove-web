import { usePreviewTray } from "../../hooks/use-preview-tray.hook";
import { hasRow } from "../../utils/has-row.util";
import { swapOf } from "./utils/swap-of.util";
import { talkingOf } from "./utils/talking-of.util";
import { StageHearToggles } from "../stage-hear-toggles";
import { StageLivePreview } from "../stage-live-preview";
import { StagePlaces } from "../stage-places";
import { StagePreviewTray } from "../stage-preview-tray";
import { useSwapping } from "./hooks/use-swapping.hook";
import styles from "./stage-also-live.component.module.css";
import type { StageAlsoLiveProps } from "./types/stage-also-live.types";

/**
 * The right of the info row: the other live streams as small previews (a click puts one on the
 * stage), then the places as little screens, red for each stream live. Past their room the previews
 * scroll; the places stay put, and go when none is free. Pointing at a preview opens its row of
 * buttons, floating, to hear that person while they stay small and swap their screen and camera.
 */
export function StageAlsoLive(props: StageAlsoLiveProps) {
  const { others, liveCount, places, free, onPick, hearOf, onHear, swappedOf, onSwap } = props;
  const tray = usePreviewTray();
  const [swapping, setSwapping] = useSwapping();
  const row = (id: string) => {
    const s = others.find((o) => o.person.id === id);
    if (!s || !hasRow(s)) return null;
    const swap = () => {
      setSwapping(id);
      onSwap?.(id);
    };
    return (
      <StageHearToggles
        sharer={s}
        hearing={hearOf(id)}
        onChange={(h) => onHear(id, h)}
        swap={swapOf(s, Boolean(swappedOf?.(id)), onSwap && swap)}
        onActive={id === tray.open?.id ? tray.setBusy : undefined}
      />
    );
  };
  return (
    <section className={styles.also} aria-label="Also live">
      <ul className={styles.strip} aria-label="Other streams">
        {others.map((s) => (
          <StageLivePreview
            key={s.person.id}
            sharer={s}
            swapped={Boolean(swappedOf?.(s.person.id))}
            swapping={swapping === s.person.id}
            talking={talkingOf(s, hearOf(s.person.id), tray.open?.id === s.person.id)}
            tray={tray}
            onPick={onPick}
          />
        ))}
      </ul>
      <StagePreviewTray tray={tray} render={row} />
      <StagePlaces liveCount={liveCount} places={places} free={free} />
    </section>
  );
}
