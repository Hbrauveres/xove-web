export interface QueueSeatOfferProps {
  /** Seconds left before the seat goes to the next person, as the API counted them. */
  seconds: number;
  onEnter: () => void;
  onCancel: () => void;
}
