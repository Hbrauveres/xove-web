import { useRef, useState } from "react";
import { Dropdown } from "@shared/components/dropdown";
import { Face } from "@shared/components/face";
import { Icon } from "@shared/components/icon";
import { IconButton } from "@shared/components/icon-button";
import { PanelSection } from "@shared/components/panel-section";
import { HeaderSeats } from "../header-seats";
import styles from "./header-people-button.component.module.css";
import { STREAMS } from "./constants/people-button.constants";
import type { HeaderPeopleButtonProps } from "./types/header-people-button.types";
import { isSharing } from "./utils/is-sharing.util";
import { peopleOrder } from "./utils/people-order.util";
import { personNote } from "./utils/person-note.util";
import { queueLine } from "./utils/queue-line.util";

/**
 * Who's here: a people icon and the number. It opens the seats, everyone with what they share or
 * watch, and the queue.
 */
export function HeaderPeopleButton({ people, meId, sharing, watchingOf, seats }: HeaderPeopleButtonProps) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const count = people.length;
  const nameOf = (id: string) => (id === meId ? "you" : (people.find((p) => p.id === id)?.name ?? "someone"));

  return (
    <div ref={anchor} className={styles.wrap}>
      <IconButton
        variant="header"
        className={styles.button}
        aria-label={`${count} ${count === 1 ? "person" : "people"} here`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Icon name="people" size={18} />
        <span className={styles.count}>{count}</span>
      </IconButton>

      <Dropdown open={open} label="Here now" anchor={anchor} onClose={() => setOpen(false)}>
        {seats && (
          <PanelSection className={styles.head}>
            <HeaderSeats seats={seats} />
          </PanelSection>
        )}
        <PanelSection scroll>
          <ul className={styles.people}>
            {peopleOrder(people, meId, sharing).map((p) => (
              <li key={p.id} className={styles.person}>
                <Face name={p.name} hue={p.hue} size={30} onAir={isSharing(sharing[p.id])} />
                <span className={styles.who}>
                  <b>{p.name}</b>
                  {p.id === meId && <span className={styles.you}> (you)</span>}
                  <small>{personNote(p.id, sharing, watchingOf, nameOf)}</small>
                </span>
                {/* The line above says it in words: the icons are only for the eye. */}
                <span className={styles.icons} aria-hidden="true">
                  {STREAMS.filter((kind) => sharing[p.id]?.[kind]).map((kind) => (
                    <span key={kind} className={styles.icon}>
                      <Icon name={`stream-${kind}`} size={14} />
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </PanelSection>
        {seats && <PanelSection className={styles.foot}>{queueLine(seats.waiting)}</PanelSection>}
      </Dropdown>
    </div>
  );
}
