import { Face } from "@shared/components/face";
import { Icon } from "@shared/components/icon";
import { useEffect, useRef, useState } from "react";
import type { StreamKind } from "@services/xove-api-service";
import type { ConnectionState } from "@services/livekit-service";
import type { ActivityEvent, Friend } from "@features/room/types/room-view.types";
import { Dropdown, DropdownSection } from "../ui/Dropdown";
import { ActivityList } from "./ActivityList";
import { describeEvent, shortAgo } from "./activityText";
import styles from "./ActivityPill.module.css";

type Props = {
  /** Oldest first. */
  events: ActivityEvent[];
  people: Friend[];
  meId: string;
  connection: ConnectionState;
  isLive: (personId: string, kind: StreamKind) => boolean;
  watching: { personId: string; kind: StreamKind } | null;
  onWatch: (personId: string, kind: StreamKind) => void;
};

/**
 * The middle of the header (spec 0104): the latest thing that happened, always current, with
 * a count of new ones. While the connection is down it says so instead. A click opens the list.
 */
export function ActivityPill({ events, people, meId, connection, isLive, watching, onWatch }: Props) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  // The newest event seen in the list; everything after it is new.
  const [seenId, setSeenId] = useState<string | null>(null);
  // The ones that were new when the list opened: they stay highlighted while it's open.
  const [newWhenOpened, setNewWhenOpened] = useState<ReadonlySet<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);

  const latest = events.at(-1);
  const seenAt = seenId === null ? -1 : events.findIndex((e) => e.id === seenId);
  const unseen = seenId !== null && seenAt === -1 ? events.length : events.length - 1 - seenAt;
  const fresh = open ? 0 : unseen;
  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? "Someone";
  const actor = latest ? (people.find((p) => p.id === latest.actorId) ?? null) : null;
  const reconnecting = connection === "reconnecting";

  // Opening shows what's new; closing marks everything seen, events that came in meanwhile too.
  const close = (returnFocus: boolean) => {
    setSeenId(events.at(-1)?.id ?? null);
    setOpen(false);
    if (returnFocus) button.current?.focus();
  };
  const toggle = () => {
    if (open) {
      close(false);
      return;
    }
    setNewWhenOpened(new Set(unseen > 0 ? events.slice(-unseen).map((e) => e.id) : []));
    setSeenId(latest?.id ?? null);
    setOpen(true);
  };

  let label: string;
  let content;
  if (reconnecting) {
    label = "Connection dropped. Reconnecting";
    content = (
      <span className={`${styles.tick} ${styles.enter}`}>
        <span className={styles.spin} aria-hidden="true" />
        <span className={styles.what}>Connection dropped. Reconnecting…</span>
      </span>
    );
  } else if (latest) {
    const text = describeEvent(latest, nameOf, meId);
    const ago = shortAgo(latest.at, now);
    label = `Activity: ${text}, ${ago === "now" ? "just now" : `${ago} ago`}${fresh ? `, ${fresh} new` : ""}`;
    content = (
      <span key={latest.id} className={`${styles.tick} ${styles.enter}`}>
        {actor && <Face name={actor.name} hue={actor.hue} size={22} />}
        <span className={styles.what}>{text}</span>
        <time className={styles.time}>{ago}</time>
      </span>
    );
  } else {
    label = "Activity: nothing new yet";
    content = (
      <span className={styles.tick}>
        <span className={styles.what}>Nothing new yet</span>
      </span>
    );
  }

  return (
    <div ref={anchor} className={styles.wrap}>
      <button
        ref={button}
        type="button"
        className={`${styles.pill} ${reconnecting ? styles.warn : ""}`}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
      >
        {!reconnecting && <Icon name="bell" size={16} className={styles.bell} />}
        {content}
        {fresh > 0 && !reconnecting && <span className={styles.new}>{fresh}</span>}
        <Icon name="chevron-bold" size={12} className={styles.chev} />
      </button>

      <Dropdown open={open} label="Activity" align="center" anchor={anchor} onClose={close}>
        <DropdownSection scroll>
          <ActivityList
            events={events}
            people={people}
            meId={meId}
            unseen={newWhenOpened}
            isLive={isLive}
            watching={watching}
            onWatch={(personId, kind) => {
              onWatch(personId, kind);
              // The list closes; the keyboard stays on the pill.
              close(true);
            }}
          />
        </DropdownSection>
      </Dropdown>
    </div>
  );
}
