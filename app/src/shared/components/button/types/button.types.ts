import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

/**
 * - primary: the one main action on a page
 * - danger: an action that removes something
 * - ghost: a second action beside the main one
 * - quiet: words alone, muted, underlined when pointed at ("Use another account", "Back to the room")
 * - light: white with dark words, a soft red ring when pointed at (Continue with Google)
 */
export type ButtonVariant = "primary" | "danger" | "ghost" | "quiet" | "light";

interface ButtonLook {
  variant?: ButtonVariant;
  size?: "sm" | "md";
}

/** A button: it does something here. */
type ButtonActionProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonLook & { to?: never; href?: never };

/** A link with the button's look: `to` a page in the app, or `href` out of it. */
export type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  ButtonLook &
  ({ to: string; href?: never } | { href: string; to?: never });

export type ButtonProps = ButtonActionProps | ButtonLinkProps;
