/** What a sign-in that came back with an error says, by the code the API puts in the address. */
export const SIGN_IN_ERRORS = {
  "login-failed": "Google sign-in didn't complete. Try again.",
  "email-not-verified": "Your Google account's email isn't verified, so it can't be used here.",
} as const;

/** What any other code says: the code itself never shows. */
export const SIGN_IN_ERROR_ANY = "Something went wrong signing you in. Try again.";
