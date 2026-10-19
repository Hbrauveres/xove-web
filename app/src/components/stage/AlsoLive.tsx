import { useEffect, useRef, useState } from "react";
import type { LiveFeed, Sharer } from "../../types";
import { Avatar } from "../ui/Avatar";
import { ScreenVideo } from "./ScreenVideo";
import { HearToggles, type Hearing } from "./HearToggles";
import { PreviewTray, usePreviewTray } from "./PreviewTray";
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
  /** Whether a person's preview shows their camera instead of their screen, and swapping it (spec 0131). */
  swappedOf?: (personId: string) => boolean;
  onSwap?: (personId: string) => void;
};

const kindOf = (feed: LiveFeed) => (feed.kind === "camera" ? "camera" : "screen");

/**
 * The right of the info row (specs 0104 and 0107): the other live streams as small previews (a
 * click puts one on the stage), then the seats as six dots, red for each stream live (spec 0123).
 * Past their room the previews scroll; the box stays put, and goes when nothing is free. Previews
 * are silent; each carries that person's two toggles, their sound and their voice (spec 0123).
 */
export function AlsoLive({ others, liveCount, free, onPick, hearOf, onHear, swappedOf, onSwap }: Props) {
  // A small preview's row (spec 0131): pointing at it opens it, a finger's hold pins it.
  const tray = usePreviewTray();
  const hold = useRef<number | undefined>(undefined);
  // A swap plays for a moment: the two pictures trade places.
  const [swapping, setSwapping] = useState<string | null>(null);
  useEffect(() => {
    if (!swapping) return;
    const done = window.setTimeout(() => setSwapping(null), 400);
    return () => window.clearTimeout(done);
  }, [swapping]);
  return (
    <section className={styles.also} aria-label="Also live">
      <ul className={styles.strip} aria-label="Other streams">
        {others.map((s) => {
          const id = s.person.id;
          const both = Boolean(s.screen && s.camera);
          const feed = (both && swappedOf?.(id) ? s.camera : s.screen) ?? s.camera;
          if (!feed) return null;
          // The other picture, behind (a screen and a camera together).
          const back = both ? (feed === s.screen ? s.camera : s.screen) : undefined;
          const backVideo = back && (s.isMe ? back.local : back.remote?.video);
          const what = kindOf(feed);
          // My own stream plays from my browser; someone else's from LiveKit, once it arrives.
          const video = s.isMe ? feed.local : feed.remote?.video;
          const name = s.isMe ? "You" : s.person.name;
          const whose = s.isMe ? "your" : `${s.person.name}'s`;
          return (
            <li
              key={id}
              className={styles.item}
              data-person={id}
              data-stacked={both || undefined}
              data-open={tray.open?.id === id || undefined}
              data-swapping={swapping === id || undefined}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse" && !s.isMe) tray.show(id, e.currentTarget);
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === "mouse") tray.leave();
              }}
              onPointerDown={(e) => {
                if (e.pointerType === "mouse" || s.isMe) return;
                const li = e.currentTarget;
                window.clearTimeout(hold.current);
                hold.current = window.setTimeout(() => tray.show(id, li, true), 500);
              }}
              onPointerUp={() => window.clearTimeout(hold.current)}
              onPointerCancel={() => window.clearTimeout(hold.current)}
              onContextMenu={(e) => e.preventDefault()}
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
                onClick={() => {
                  // The hold that opened the row isn't a click on the preview.
                  if (tray.open?.pinned && tray.open.id === id) return;
                  onPick(id);
                }}
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
                  <Avatar person={s.person} size={16} />
                  {name} · {what}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {/* Too small for buttons on the picture (spec 0131): the open preview's row, floating. */}
      {(() => {
        const s = tray.open && others.find((o) => o.person.id === tray.open!.id);
        if (!s || s.isMe) return null;
        const id = s.person.id;
        const both = Boolean(s.screen && s.camera);
        return (
          <PreviewTray tray={tray}>
            <HearToggles
              sharer={s}
              hearing={hearOf(id)}
              onChange={(h) => onHear(id, h)}
              layout="tray"
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
              onActive={tray.setBusy}
            />
          </PreviewTray>
        );
      })()}
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
