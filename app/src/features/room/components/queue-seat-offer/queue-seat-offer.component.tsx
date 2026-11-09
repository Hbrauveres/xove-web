import { useEffect, useRef } from "react";
import { Button } from "@shared/components/button";
import styles from "./queue-seat-offer.component.module.css";
import { useSecondsLeft } from "./hooks/use-seconds-left.hook";
import { useTurnTitle } from "./hooks/use-turn-title.hook";
import type { QueueSeatOfferProps } from "./types/queue-seat-offer.types";
import { tabCycle } from "./utils/tab-cycle.util";

/**
 * A seat is free for me: enter within the time, or cancel (Escape too). With no answer, the API
 * moves me to the end of the queue and offers the seat to the next person. The browser's own
 * modal dialog keeps the page behind it out of reach; Tab goes round its two buttons.
 */
export function QueueSeatOffer({ seconds, onEnter, onCancel }: QueueSeatOfferProps) {
  const left = useSecondsLeft(seconds);
  const dialog = useRef<HTMLDialogElement>(null);
  useTurnTitle();
  useEffect(() => {
    const shown = dialog.current;
    shown?.showModal();
    return () => shown?.close();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    if (e.key !== "Tab") return;
    const next = tabCycle(e.currentTarget, document.activeElement, e.shiftKey);
    if (!next) return;
    e.preventDefault();
    next.focus();
  };
  // Escape: the dialog says it's cancelled; it stays until the room moves on.
  const onDialogCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    onCancel();
  };

  return (
    <dialog
      ref={dialog}
      className={styles.window}
      aria-labelledby="seat-offer-title"
      aria-describedby="seat-offer-text"
      onKeyDown={onKeyDown}
      onCancel={onDialogCancel}
    >
      <h2 id="seat-offer-title" className={styles.title}>
        It's your turn
      </h2>
      <p id="seat-offer-text" className={styles.text}>
        A seat in the room is free for you. Enter within <strong>{left} seconds</strong>, or it goes to the next person
        and you go to the end of the line.
      </p>
      <div className={styles.actions}>
        <Button autoFocus onClick={onEnter}>
          Enter room
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </dialog>
  );
}
