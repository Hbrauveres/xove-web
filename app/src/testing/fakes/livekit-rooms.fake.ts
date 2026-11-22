/** Every fake room a test created, so it can play the other people: `lastRoom().join("user-7", "Bruno")`. */
import { resetFakeDevices } from "./livekit-devices.fake";
import type { Room } from "./livekit-room.fake";

export const rooms: Room[] = [];
let publishSeq = 0;

/** The id of the next extra screen I publish: they count from 1 in each test. */
export const nextPublishNumber = () => ++publishSeq;

/** After every test (setup.ts): no room, the ids counting from 1, the browser's devices as they were. */
export function resetFakeLiveKit() {
  rooms.length = 0;
  publishSeq = 0;
  resetFakeDevices();
}

export const lastRoom = () => {
  const room = rooms.at(-1);
  if (!room) throw new Error("No LiveKit room was created");
  return room;
};
