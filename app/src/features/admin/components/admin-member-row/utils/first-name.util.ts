/** The first of a name's words, for a button that names someone; "member" without a name. */
export function firstName(name: string | null): string {
  return name?.split(" ")[0] || "member";
}
