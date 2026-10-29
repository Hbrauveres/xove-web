/** The name the room shows: the first word, or "Someone". */
export const firstName = (name: string | null | undefined) => name?.trim().split(/\s+/)[0] || "Someone";
