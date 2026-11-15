export interface AdminRemoveConfirmProps {
  /** Their first name, on the confirming button ("Remove Ana"). */
  firstName: string;
  /** Another action is running: the confirming button waits. */
  busy: boolean;
  /** Removes them; the question closes once it's done, gone or not. */
  onRemove: () => Promise<void>;
}
