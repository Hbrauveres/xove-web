/** What the routes give the room page. */
export type RoomPageProps = {
  /** How often to ask the API which streams are live. Tests pass a short one. */
  pollMs?: number;
};
