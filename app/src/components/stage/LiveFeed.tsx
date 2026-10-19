import type { Friend, LiveFeed as Feed, Sharer } from "../../types";
import { NowWatching, STREAM_PLACES } from "./NowWatching";
import { ScreenVideo } from "./ScreenVideo";
import { stackOf, useSwapping } from "./stack";
import { HearToggles, type Hearing } from "./HearToggles";
import styles from "./LiveFeed.module.css";

type Props = {
  /** Everyone sharing except the person on the stage, longest first. */
  others: Sharer[];
  /** Live streams of the 6, everyone's. */
  liveCount: number;
  /** Who has this person's stream on their stage (spec 0107). */
  watchersOf: (personId: string) => Friend[];
  onPick: (personId: string) => void;
  /** What I hear from each person, and muting it from their card (spec 0123). */
  hearOf?: (personId: string) => Hearing;
  onHear?: (personId: string, hearing: Hearing) => void;
  /** Whether a person's card shows their camera instead of their screen, and swapping it (spec 0131). */
  swappedOf?: (personId: string) => boolean;
  onSwap?: (personId: string) => void;
};

const kindOf = (feed: Feed) => (feed.kind === "camera" ? "camera" : "screen");

/**
 * Under the phone's stage (spec 0158): the other live streams, like the YouTube app's feed. Each
 * is a full-width picture, then who, LIVE, for how long and who's watching, with that person's
 * buttons on the picture to hear them while they stay small (spec 0131). A tap puts it on the stage.
 */
export function LiveFeed({ others, liveCount, watchersOf, onPick, hearOf, onHear, swappedOf, onSwap }: Props) {
  // A swap plays for a moment: the two pictures trade places (spec 0131).
  const [swapping, setSwapping] = useSwapping();
  return (
    <section className={styles.feed} aria-labelledby="live-now">
      <h2 id="live-now" className={styles.head}>
        <span>Live now</span>
        <span className={styles.count}>
          {liveCount} of {STREAM_PLACES}
        </span>
      </h2>
      <ul className={styles.list}>
        {others.map((s) => {
          const id = s.person.id;
          const { both, feed, video, back, backVideo } = stackOf(s, Boolean(swappedOf?.(id)));
          if (!feed) return null;
          const what = kindOf(feed);
          const whose = s.isMe ? "your" : `${s.person.name}'s`;
          return (
            <li
              key={id}
              className={styles.card}
              data-stacked={both || undefined}
              data-swapping={swapping === id || undefined}
            >
              <div className={styles.frame}>
                {/* Someone sharing a screen and a camera: the other picture peeks out behind (spec 0131). */}
                {both && (
                  <span className={styles.behind} aria-hidden="true">
                    {backVideo && <ScreenVideo key={back!.kind} video={backVideo} label="" />}
                  </span>
                )}
                <button
                  type="button"
                  className={styles.picture}
                  aria-label={`Watch ${whose} ${what}`}
                  onClick={() => onPick(id)}
                >
                  {video ? (
                    <ScreenVideo
                      video={video}
                      label={`${s.isMe ? "Your" : `${s.person.name}'s`} ${what === "screen" ? "shared screen" : "camera"}`}
                    />
                  ) : (
                    <span className={styles.loading}>Loading…</span>
                  )}
                </button>
                {/* Beside the picture's button, never in it: their sound and voice (spec 0123); on mine, only the swap. */}
                {(!s.isMe || both) && hearOf && onHear && (
                  <span className={styles.voice}>
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
                    />
                  </span>
                )}
              </div>
              {/* The line under it opens the stream too; the keyboard uses the picture's button. */}
              <div className={styles.info} onClick={() => onPick(id)}>
                <NowWatching compact level={3} sharer={s} watchers={watchersOf(id)} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
