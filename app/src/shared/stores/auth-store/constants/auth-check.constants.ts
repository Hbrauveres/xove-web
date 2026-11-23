const BAD_GATEWAY = 502;
const SERVICE_UNAVAILABLE = 503;
const GATEWAY_TIMEOUT = 504;

/** The proxy's answers while the API itself is down. */
export const UNREACHABLE_STATUSES: readonly number[] = [BAD_GATEWAY, SERVICE_UNAVAILABLE, GATEWAY_TIMEOUT];

const DOUBLE = 2;
/** The first wait after a check gets no answer. */
const FIRST_WAIT_MS = 2_000;
/** The longest wait between two tries. */
const LONGEST_WAIT_MS = 30_000;
/** How many times it tries again on its own before it stops and says so. */
const TRIES = 6;
/** The waits between tries while the API can't be reached: 2, 4, 8, 16, 30 and 30 s (about 1.5 min). */
export const RETRY_DELAYS_MS: readonly number[] = Array.from({ length: TRIES }, (_, i) =>
  Math.min(FIRST_WAIT_MS * DOUBLE ** i, LONGEST_WAIT_MS),
);
/** How long one check may take before it counts as no answer. */
export const CHECK_TIMEOUT_MS = 10_000;
/** After a pressed try fails, how long before Try again can be pressed again. */
export const RETRY_COOLDOWN_MS = 5_000;
