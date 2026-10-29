/** Where the browser goes to start Google login. A full page navigation, not a fetch. */
export const GOOGLE_LOGIN_URL = "/api/oauth2/authorization/google";

/** What a failed request says when the API gives no message of its own. */
export const FALLBACK_MESSAGES: Record<number, string> = {
  401: "Your session ended. Sign in again.",
  403: "You don't have permission to do that.",
  404: "That no longer exists.",
  409: "That was already done.",
};
