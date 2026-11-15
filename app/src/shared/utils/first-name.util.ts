/** The first word of a name, as a person is called in a line or on a button; `otherwise` without a name. */
export const firstName = (name: string | null | undefined, otherwise = "Someone") =>
  name?.trim().split(/\s+/)[0] || otherwise;
