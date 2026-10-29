/** The CSRF token Spring put in the cookie, or undefined when there's none. */
export function csrfTokenFrom(cookie: string): string | undefined {
  const value = cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  return value === undefined ? undefined : decodeURIComponent(value);
}
