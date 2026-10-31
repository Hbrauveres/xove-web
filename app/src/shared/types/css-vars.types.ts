import type { CSSProperties } from "react";

/** A style that also sets CSS variables. */
export type CssVars = CSSProperties & { [name: `--${string}`]: string | number };
