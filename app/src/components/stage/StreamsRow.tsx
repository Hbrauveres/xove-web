import { useEffect, useRef, useState } from "react";
import type { LiveFeed as Feed, Sharer } from "../../types";
import { STREAM_PLACES } from "./NowWatching";
import { HearToggles, type Hearing } from "./HearToggles";
import { ScreenVideo } from "./ScreenVideo";
import styles from "./StreamsRow.module.css";

type Props = {
  /** Everyone sharing except the person on the stage, longest first. */
  others: Sharer[];
  /** Live streams of the 6, everyone's. */
  liveCount: number;
  open: boolean;
  /** The arrow button, closed: opens the row. */
  onOpen: () => void;
  /** The arrow button, open: closes it. */
  onClose: () => void;
  onPick: (personId: string) => void;
  /** What I hear from each person, and muting it from their picture (spec 0123). */
  hearOf?: (personId: string) => Hearing;
  onHear?: (personId: string, hearing: Hearing) => void;
  swappedOf?: (personId: string) => boolean;
  onSwap?: (personId: string) => void;
};

const kindOf = (feed: Feed) => (feed.kind === "camera" ? "camera" : "screen");

/** A round button with a chevron: up opens the row, down closes it. */
function ArrowButton({ up, onClick, className }: { up: boolean; onClick: () => void; className: string }) {
  return (
    <button
      type="button"
      className={className}
      data-no-swipe
      data-fades={up || undefined}
      data-arrow={up ? "up" : "down"}
      aria-label={up ? "Show the other streams" : "Hide the other streams"}
      onClick={onClick}
    >
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
        <path
          d={up ? "M5 12.5 10 7.5l5 5" : "M5 7.5 10 12.5l5-5"}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/**
 * Sideways (spec 0160): the other live streams in one row of small pictures along the bottom,
 * over a black gradient. Silent, like the upright feed; each picture carries that person's two
 * toggles, their sound and their voice (spec 0123). It slides up when open. A swipe opens
 * and closes it, and so does a round button at the bottom left: an arrow up while it's closed,
 * an arrow down on the row while it's open.
 */
export function StreamsRow({ others, liveCount, open, onOpen, onClose, onPick, hearOf, onHear, swappedOf, onSwap }: Props) {
  // A hold on a picture opens its buttons over it (spec 0131): the pictures are too small to carry them.
  const [held, setHeld] = useState<string | null>(null);
  const hold = useRef<number | undefined>(undefined);
  const [swapping, setSwapping] = useState<string | null>(null);
  useEffect(() => {
    if (!swapping) return;
    const done = window.setTimeout(() => setSwapping(null), 400);
    return () => window.clearTimeout(done);
  }, [swapping]);
  useEffect(() => {
    if (!held) return;
    const away = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.(`[data-person="${held}"]`)) setHeld(null);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [held]);
  return (
    <>
      {!open && <ArrowButton up className={styles.toggle} onClick={onOpen} />}
      <section
        className={styles.row}
        data-open={open || undefined}
        data-no-swipe
        aria-labelledby="streams-row"
        aria-hidden={!open}
        inert={!open}
      >
        <h2 id="streams-row" className={styles.head}>
          {open && <ArrowButton up={false} className={styles.toggleOpen} onClick={onClose} />}
          <span className={styles.title}>Live now</span>
          <span className={styles.count}>
            {liveCount} of {STREAM_PLACES}
          </span>
        </h2>
        <ul className={styles.list}>
          {others.map((s) => {
            const both = Boolean(s.screen && s.camera);
            const feed = (both && swappedOf?.(s.person.id) ? s.camera : s.screen) ?? s.camera;
            if (!feed) return null;
            const back = both ? (feed === s.screen ? s.camera : s.screen) : undefined;
            const backVideo = back && (s.isMe ? back.local : back.remote?.video);
            const what = kindOf(feed);
            const video = s.isMe ? feed.local : feed.remote?.video;
            const name = s.isMe ? "You" : s.person.name;
            const whose = s.isMe ? "your" : `${s.person.name}'s`;
            // Their voice heard while they speak: the picture's ring lights, or the button does while
            // the buttons are open (spec 0131).
            const talking =
              !s.isMe && s.hasVoice && s.speaking && hearOf && !hearOf(s.person.id).voice.muted && held !== s.person.id;
            return (
              <li
                key={s.person.id}
                className={styles.item}
                data-person={s.person.id}
                data-held={held === s.person.id || undefined}
                data-stacked={both || undefined}
                data-swapping={swapping === s.person.id || undefined}
                data-talking={talking || undefined}
                onPointerDown={() => {
                  if (s.isMe) return;
                  window.clearTimeout(hold.current);
                  hold.current = window.setTimeout(() => setHeld(s.person.id), 500);
                }}
                onPointerUp={() => window.clearTimeout(hold.current)}
                onPointerCancel={() => window.clearTimeout(hold.current)}
                onContextMenu={(e) => e.preventDefault()}
              >
                {/* A screen and a camera: the other picture peeks out behind (spec 0131). */}
                {both && (
                  <span className={styles.behind} aria-hidden="true">
                    {backVideo && <ScreenVideo key={back!.kind} video={backVideo} label="" />}
                  </span>
                )}
                <button
                  type="button"
                  className={styles.picture}
                  aria-label={`Watch ${whose} ${what}`}
                  onClick={() => held !== s.person.id && onPick(s.person.id)}
                >
                  {video && (
                    <ScreenVideo
                      video={video}
                      label={`${s.isMe ? "Your" : `${s.person.name}'s`} ${what === "screen" ? "shared screen" : "camera"}`}
                    />
                  )}
                  <span className={styles.name}>{name}</span>
                </button>
                {/* Beside the picture's button, never in it. */}
                {!s.isMe && hearOf && onHear && held === s.person.id && (
                  <span className={styles.hear}>
                    <HearToggles
                      sharer={s}
                      hearing={hearOf(s.person.id)}
                      onChange={(h) => onHear(s.person.id, h)}
                      layout="tray"
                      swap={
                        both && onSwap
                          ? {
                              on: Boolean(swappedOf?.(s.person.id)),
                              onSwap: () => {
                                setSwapping(s.person.id);
                                onSwap(s.person.id);
                              },
                            }
                          : undefined
                      }
                    />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
