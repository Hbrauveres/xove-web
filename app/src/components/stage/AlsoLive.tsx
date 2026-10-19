import type { LiveFeed, Sharer } from "../../types";
import { Avatar } from "../ui/Avatar";
import { ScreenVideo } from "./ScreenVideo";
import { HearToggles, type Hearing } from "./HearToggles";
import { seatsOpen } from "./NowWatching";
import styles from "./AlsoLive.module.css";

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
};

const kindOf = (feed: LiveFeed) => (feed.kind === "camera" ? "camera" : "screen");

/**
 * The right of the info row (specs 0104 and 0107): the other live streams as small previews (a
 * click puts one on the stage), then the seats as six dots, red for each stream live (spec 0123).
 * Past their room the previews scroll; the box stays put, and goes when nothing is free. Previews
 * are silent; each carries that person's two toggles, their sound and their voice (spec 0123).
 */
export function AlsoLive({ others, liveCount, free, onPick, hearOf, onHear }: Props) {
  return (
    <section className={styles.also} aria-label="Also live">
      <ul className={styles.strip} aria-label="Other streams">
        {others.map((s) => {
          const feed = s.screen ?? s.camera;
          if (!feed) return null;
          const id = s.person.id;
          const what = kindOf(feed);
          // My own stream plays from my browser; someone else's from LiveKit, once it arrives.
          const video = s.isMe ? feed.local : feed.remote?.video;
          const name = s.isMe ? "You" : s.person.name;
          const whose = s.isMe ? "your" : `${s.person.name}'s`;
          return (
            <li key={id} className={styles.item}>
              <button
                type="button"
                className={styles.preview}
                aria-label={`Watch ${whose} ${what}`}
                onClick={() => onPick(id)}
              >
                <span className={styles.video}>
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
                  <Avatar person={s.person} size={16} />
                  {name} · {what}
                </span>
              </button>
              {/* Their sound and voice, muted or not for me without opening them (spec 0123). */}
              {!s.isMe && (
                <span className={styles.sound}>
                  <HearToggles sharer={s} hearing={hearOf(id)} onChange={(h) => onHear(id, h)} />
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {free > 0 && (
        // The six seats as dots, red for each stream live (spec 0123); gone when all are taken.
        <p
          className={styles.free}
          data-free
          role="img"
          aria-label={`${liveCount} of 6 live, ${seatsOpen(free)}`}
          title={`${liveCount} of 6 live · ${seatsOpen(free)}`}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <i key={i} data-on={i < liveCount || undefined} />
          ))}
        </p>
      )}
    </section>
  );
}
