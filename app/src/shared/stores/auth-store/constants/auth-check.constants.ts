const BAD_GATEWAY = 502;
const SERVICE_UNAVAILABLE = 503;
const GATEWAY_TIMEOUT = 504;

/** The proxy's answers while the API itself is down. */
export const UNREACHABLE_STATUSES: readonly number[] = [BAD_GATEWAY, SERVICE_UNAVAILABLE, GATEWAY_TIMEOUT];
