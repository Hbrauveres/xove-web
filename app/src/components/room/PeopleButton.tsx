import { Face } from "@shared/components/face";
import { IconButton } from "@shared/components/icon-button";
import { Icon } from "@shared/components/icon";
import { useRef, useState } from "react";
import type { RoomSeatsState, StreamKind } from "@services/xove-api-service";
import type { Friend } from "@features/room/types/room-view.types";
import { Dropdown, DropdownSection } from "../ui/Dropdown";
import styles from "./PeopleButton.module.css";

type Props = {
  /** Everyone in the room, me first. */
  people: Friend[];
  meId: string;
  /** What each person shares, by their id. */
  sharing: Record<string, { screen: boolean; camera: boolean }>;
  /** Whose stream each person has on their stage, by their id (spec 0104). */
  watchingOf: Record<string, { sharerId: string; kind: StreamKind }>;
  /** The room's seats, or null when the API doesn't say. */
  seats: RoomSeatsState | null;
};

/**
 * Who's here (spec 0104): a people icon and the number; it opens the seats, everyone with
 * what they share or whose stream they watch, and the queue.
 */
export function PeopleButton({ people, meId, sharing, watchingOf, seats }: Props) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const count = people.length;
  // People sharing first (longest first), then me, then everyone else, as in the design.
  const sharerIds = Object.keys(sharing);
  const ordered = [
    ...sharerIds.map((id) => people.find((p) => p.id === id)).filter((p): p is Friend => p !== undefined),
    ...people.filter((p) => !sharing[p.id] && p.id === meId),
    ...people.filter((p) => !sharing[p.id] && p.id !== meId),
  ];
  const nameOf = (id: string) => (id === meId ? "you" : (people.find((p) => p.id === id)?.name ?? "someone"));

  const noteOf = (p: Friend) => {
    const shares = sharing[p.id];
    if (shares?.screen && shares.camera) return "Sharing screen and camera";
    if (shares?.screen) return "Sharing their screen";
    if (shares?.camera) return "Sharing their camera";
    const watch = watchingOf[p.id];
    return watch ? `Watching ${nameOf(watch.sharerId)}` : "In the room";
  };

  const waiting = seats?.waiting ?? 0;
  const queue =
    waiting === 0
      ? "Nobody is waiting for a seat."
      : waiting === 1
        ? "1 person is waiting for a seat."
        : `${waiting} people are waiting for a seat.`;

  return (
    <div ref={anchor} className={styles.wrap}>
      <IconButton
        variant="header"
        ref={button}
        className={styles.button}
        aria-label={`${count} ${count === 1 ? "person" : "people"} here`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Icon name="people" size={18} />
        <span className={styles.count}>{count}</span>
      </IconButton>

      <Dropdown
        open={open}
        label="Here now"
        anchor={anchor}
        onClose={(returnFocus) => {
          setOpen(false);
          if (returnFocus) button.current?.focus();
        }}
      >
        {seats && (
          <DropdownSection className={styles.head}>
            <div className={styles.line}>
              <span>Seats</span>
              <span>
                <b>{seats.taken}</b> of {seats.total} · {Math.max(0, seats.total - seats.taken)} free
              </span>
            </div>
            <div
              className={styles.bar}
              role="progressbar"
              aria-label="Seats taken"
              aria-valuemin={0}
              aria-valuemax={seats.total}
              aria-valuenow={seats.taken}
            >
              <i style={{ width: `${Math.min(100, (seats.taken / seats.total) * 100)}%` }} />
            </div>
          </DropdownSection>
        )}
        <DropdownSection scroll>
          <ul className={styles.people}>
            {ordered.map((p) => {
              const shares = sharing[p.id];
              return (
                <li key={p.id} className={styles.person}>
                  <Face name={p.name} hue={p.hue} size={30} onAir={Boolean(shares?.screen || shares?.camera)} />
                  <span className={styles.who}>
                    <b>{p.name}</b>
                    {p.id === meId && <span className={styles.you}> (you)</span>}
                    <small>{noteOf(p)}</small>
                  </span>
                  <span className={styles.icons}>
                    {(["screen", "camera"] as const)
                      .filter((kind) => shares?.[kind])
                      .map((kind) => (
                        <span
                          key={kind}
                          className={styles.icon}
                          role="img"
                          aria-label={kind === "screen" ? "Screen" : "Camera"}
                        >
                          <Icon name={kind === "camera" ? "stream-camera" : "stream-screen"} size={14} />
                        </span>
                      ))}
                  </span>
                </li>
              );
            })}
          </ul>
        </DropdownSection>
        {seats && <DropdownSection className={styles.foot}>{queue}</DropdownSection>}
      </Dropdown>
    </div>
  );
}
