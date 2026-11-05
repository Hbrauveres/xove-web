import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "danger" | "ghost";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md";
};
