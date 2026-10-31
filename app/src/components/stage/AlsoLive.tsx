import { Face } from "@shared/components/face";
import type { LiveFeed, Sharer } from "@features/room/types/room-view.types";
import { ScreenVideo } from "./ScreenVideo";
import { stackOf, useSwapping } from "./stack";
import { HearToggles, type Hearing } from "./HearToggles";
import { PreviewTray } from "./PreviewTray";
import { floatingStore } from "@shared/stores/floating-store";
import { usePreviewTray } from "./usePreviewTray";
import { useKeyboardLast } from "@features/room/hooks/use-keyboard-last.hook";
import { seatsOpen } from "./NowWatching";
import styles from "./AlsoLive.module.css";
import { Tooltip } from "@shared/components/tooltip";

type Props = {
  /** Everyone sharing except the person on the stage, longest first. */
  others: Sharer[];
  /** Live streams of the 6, everyone's. */
  liveCount: number;
  /** Places left of the 6. */
  free: number;
  onPick: (personId: string) => void;
  /** What I hear from each person, and muting it from their preview (spec 0123). */
  hearOf: (personId: string) => Hearing;
  onHear: (personId: string, hearing: Hearing) => void;
  /** Whether a person's preview shows their camera instead of their screen, and swapping it (spec 0131). */
  swappedOf?: (personId: string) => boolean;
  onSwap?: (personId: string) => void;
};

const kindOf = (feed: LiveFeed) => (feed.kind === "camera" ? "camera" : "screen");

/**
 * The right of the info row (specs 0104 and 0107): the other live streams as small previews (a
 * click puts one on the stage), then the seats as six dots, red for each stream live (spec 0123).
 * Past their room the previews scroll; the box stays put, and goes when nothing is free. Pointing
 * at a preview opens its row of buttons, to hear that person while they stay small
 * and swap their screen and camera (spec 0131).
 */
export function AlsoLive({ others, liveCount, free, onPick, hearOf, onHear, swappedOf, onSwap }: Props) {
  // A small preview's row: pointing at it opens it.
  const tray = usePreviewTray();
  const keyboardLast = useKeyboardLast();
  // A swap plays for a moment: the two pictures trade places.
  const [swapping, setSwapping] = useSwapping();
  return (
    <section className={styles.also} aria-label="Also live">
      <ul className={styles.strip} aria-label="Other streams">
        {others.map((s) => {
          const id = s.person.id;
          const { both, feed, video, back, backVideo } = stackOf(s, Boolean(swappedOf?.(id)));
          if (!feed) return null;
          const what = kindOf(feed);
          const name = s.isMe ? "You" : s.person.name;
          const whose = s.isMe ? "your" : `${s.person.name}'s`;
          // Their voice heard while they speak: the picture's ring lights, or the button does while the
          // row is open (spec 0131).
          const talking = !s.isMe && s.hasVoice && s.speaking && !hearOf(id).voice.muted && tray.open?.id !== id;
          return (
            <li
              key={id}
              className={styles.item}
              data-person={id}
              data-stacked={both || undefined}
              data-open={tray.open?.id === id || undefined}
              data-swapping={swapping === id || undefined}
              data-talking={talking || undefined}
              onPointerEnter={(e) => {
                if ((!s.isMe || both) && floatingStore.canRest(e.currentTarget)) tray.show(id, e.currentTarget);
              }}
              onPointerLeave={() => tray.leave()}
            >
              {/* Someone sharing a screen and a camera: the other picture peeks out behind. */}
              {both && (
                <span className={styles.behind} aria-hidden="true">
                  {backVideo && <ScreenVideo key={back!.kind} video={backVideo} label="" />}
                </span>
              )}
              <button
                type="button"
                className={styles.preview}
                aria-label={`Watch ${whose} ${what}`}
                // By keyboard, focusing a preview opens its row, and Tab goes into it (spec 0131).
                onFocus={(e) => {
                  if (keyboardLast() && (!s.isMe || both)) tray.show(id, e.currentTarget.closest("li")!);
                }}
                onBlur={(e) => {
                  const to = e.relatedTarget as Element | null;
                  if (!to?.closest(`[data-tray-for="${id}"]`)) tray.leave();
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Tab" || e.shiftKey || tray.open?.id !== id) return;
                  const first = document.querySelector<HTMLElement>(
                    `[data-tray-for="${id}"]:not([data-leaving]) button`,
                  );
                  if (!first) return;
                  e.preventDefault();
                  first.focus();
                }}
                onClick={() => onPick(id)}
              >
                <span className={styles.video} data-picture>
                  {video ? (
                    <ScreenVideo
                      video={video}
                      label={`${s.isMe ? "Your" : `${s.person.name}'s`} ${what === "screen" ? "shared screen" : "camera"}`}
                    />
                  ) : (
                    <span className={styles.loading}>Loading…</span>
                  )}
                </span>
                <span className={styles.chip}>
                  <Face name={s.person.name} hue={s.person.hue} size={16} />
                  {name} · {what}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {/* Too small for buttons on the picture (spec 0131): the open preview's row, floating. */}
      <PreviewTray
        tray={tray}
        render={(id) => {
          const s = others.find((o) => o.person.id === id);
          const both = Boolean(s?.screen && s?.camera);
          // My own preview: only its swap, when I share both.
          if (!s || (s.isMe && !both)) return null;
          return (
            <HearToggles
              sharer={s}
              hearing={hearOf(id)}
              onChange={(h) => onHear(id, h)}
              swap={
                both && onSwap
                  ? {
                      on: Boolean(swappedOf?.(id)),
                      onSwap: () => {
                        setSwapping(id);
                        onSwap(id);
                      },
                    }
                  : undefined
              }
              onActive={id === tray.open?.id ? tray.setBusy : undefined}
            />
          );
        }}
      />
      {free > 0 && (
        // The six seats as little screens, red for each stream live (specs 0123 and 0136); gone when
        // all are taken.
        <Tooltip text={`${liveCount} of 6 live · ${seatsOpen(free)}`}>
          <p className={styles.free} data-free role="img" aria-label={`${liveCount} of 6 live, ${seatsOpen(free)}`}>
            {Array.from({ length: 6 }, (_, i) => (
              <i key={i} data-on={i < liveCount || undefined} />
            ))}
          </p>
        </Tooltip>
      )}
    </section>
  );
}
