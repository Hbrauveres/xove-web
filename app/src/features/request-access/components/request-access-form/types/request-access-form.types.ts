export interface RequestAccessFormProps {
  /** Their last request was declined: the page says so, and its button asks again. */
  declined: boolean;
  /** The request went: the page moves on to the wait. */
  onSent: () => Promise<void>;
}
