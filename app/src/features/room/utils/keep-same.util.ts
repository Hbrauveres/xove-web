/** The same record when every key holds the same value, else the new one. */
export function keepSame<T extends object>(before: T | null, now: T): T {
  if (before === null) return now;
  const keys = Object.keys(now);
  const same =
    keys.length === Object.keys(before).length &&
    keys.every((k) => JSON.stringify(Reflect.get(now, k)) === JSON.stringify(Reflect.get(before, k)));
  return same ? before : now;
}
