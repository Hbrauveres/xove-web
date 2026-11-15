import { SIGN_IN_ERRORS, SIGN_IN_ERROR_ANY } from "../constants/sign-in-errors.constants";

/** The words for a sign-in's error code from the address, or none without one. */
export function signInError(code: string | null): string | null {
  if (code === null) return null;
  const words: Readonly<Record<string, string | undefined>> = SIGN_IN_ERRORS;
  return words[code] ?? SIGN_IN_ERROR_ANY;
}
