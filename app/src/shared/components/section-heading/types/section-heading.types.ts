export interface SectionHeadingProps {
  id?: string | undefined;
  className?: string | undefined;
  children: string;
  /** How many things the part holds, in a chip after the heading. */
  count?: number | undefined;
  /** The chip red: something there needs you. */
  attention?: boolean | undefined;
}
