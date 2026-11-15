import { useRef, useState } from "react";
import { Dropdown } from "@shared/components/dropdown";
import { Face } from "@shared/components/face";
import { PersonRow } from "@shared/components/person-row";
import { Icon } from "@shared/components/icon";
import { IconButton } from "@shared/components/icon-button";
import { PanelSection } from "@shared/components/panel-section";
import { personName } from "../../../utils/person-name.util";
import { HeaderSeats } from "../header-seats";
import { HeaderStreamIcons } from "../header-stream-icons";
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
export function HeaderPeopleButton({ people, meId, sharing, watchingOf, seats, meTalking }: HeaderPeopleButtonProps) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const count = people.length;
  const nameOf = (id: string) => (id === meId ? "you" : personName(people, id, "someone"));

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
                <PersonRow
                  face={
                    <Face
                      name={p.name}
                      hue={p.hue}
                      size={30}
                      onAir={isSharing(sharing[p.id])}
                      talking={p.id === meId && meTalking}
                    />
                  }
                  name={
                    <>
                      {p.name}
                      {p.id === meId && <span className={styles.you}> (you)</span>}
                    </>
                  }
                  line={personNote(p.id, sharing, watchingOf, nameOf)}
                  end={<HeaderStreamIcons kinds={STREAMS.filter((kind) => sharing[p.id]?.[kind])} />}
                />
              </li>
            ))}
          </ul>
        </PanelSection>
        {seats && <PanelSection className={styles.foot}>{queueLine(seats.waiting)}</PanelSection>}
      </Dropdown>
    </div>
  );
}
