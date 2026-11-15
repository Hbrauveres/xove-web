export interface AdminRemoveConfirmProps {
  /** Their first name, on the confirming button ("Remove Ana"). */
  firstName: string;
  /** This removal is being asked about: "Remove Ana" and Cancel show. */
  asking: boolean;
  /** Another action is running: the confirming button waits. */
  busy: boolean;
  /** Asks about this removal, or (`false`) takes the question back. */
  onAsk: (asking: boolean) => void;
  /** Removes them; the admin store closes the question once it's done. */
  onRemove: () => void;
}
