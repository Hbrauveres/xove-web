/** The headers of a call: JSON in and out, and the CSRF token when there is one. */
export function requestHeaders(hasBody: boolean, token: string | undefined): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (hasBody) headers["Content-Type"] = "application/json";
  if (token) headers["X-XSRF-TOKEN"] = token;
  return headers;
}
