/** Up to this many people are named; past it, the first ones are, then "and N others". */
const NAMED_UP_TO = 3;
const NAMED_BEFORE_OTHERS = 2;

/**
 * Who's in the room, for an empty stage: up to three names, then "and N others". The stage itself
 * asks you to go live, so this doesn't.
 */
export function whoIsHere(names: string[]): string {
  if (names.length === 0) return "Nobody else is here yet.";
  if (names.length === 1) return `${names[0]} is here.`;
  const list =
    names.length <= NAMED_UP_TO
      ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
      : `${names[0]}, ${names[1]} and ${names.length - NAMED_BEFORE_OTHERS} others`;
  return `${list} are here.`;
}
