/** How many wait for a seat, in words. */
export function queueLine(waiting: number): string {
  if (waiting === 0) return "Nobody is waiting for a seat.";
  if (waiting === 1) return "1 person is waiting for a seat.";
  return `${waiting} people are waiting for a seat.`;
}
