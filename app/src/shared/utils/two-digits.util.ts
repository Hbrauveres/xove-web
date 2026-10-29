import { CLOCK_DIGITS } from "../constants/time.constants";

/** A clock's number on two digits: 7 → "07". */
export function twoDigits(n: number): string {
  return String(n).padStart(CLOCK_DIGITS, "0");
}
