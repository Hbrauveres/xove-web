import styles from "./headline.component.module.css";
import type { HeadlineProps } from "./types/headline.types";

/** A big statement, its key words in the accent: the sign-in page's title, the empty stage's. */
export function Headline({ level, className, children, ...heading }: HeadlineProps) {
  const Heading = level === "page" ? "h1" : "h2";
  return (
    <Heading className={className ? `${styles.headline} ${className}` : styles.headline} {...heading}>
      {children}
    </Heading>
  );
}
