import type { ButtonLinkProps, ButtonProps, ButtonVariant } from "../types/button.types";

/** The classes for a look and a size, and the place's own class if any. */
export function buttonClasses(
  styles: Readonly<Record<string, string>>,
  variant: ButtonVariant = "primary",
  size: "sm" | "md" = "md",
  className?: string,
): string {
  return [styles.button, styles[variant], styles[size], className].filter(Boolean).join(" ");
}

/** A button that goes somewhere is a link. */
export function isButtonLink(props: ButtonProps): props is ButtonLinkProps {
  return props.to !== undefined || props.href !== undefined;
}
