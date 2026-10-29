/** One sound as I hear it: its volume and whether it's off. */
type Level = { volume: number; muted: boolean };

/** What I hear from one person: their screen's sound and their voice. */
export type Heard = { sound: Level; voice: Level };

/** What I chose for one person: each volume, and each switch once I touched it. */
export type Choices = { sound: { volume: number; muted?: boolean }; voice: { volume: number; muted?: boolean } };
