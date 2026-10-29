import type {
  AccessRequestView,
  LiveKitAccess,
  Me,
  MemberView,
  SeatStatus,
  SharingConnection,
  StreamKind,
  StreamSettings,
  StreamsState,
} from "./types/api.types";
import { FALLBACK_MESSAGES } from "./constants/api.constants";

/** An error the API answered with. `message` is safe to show to the user. */
export class ApiError extends Error {
  readonly status: number;
  /** Why, when the API says (e.g. "full" when the 6 stream places are taken). */
  readonly reason: string | undefined;

  constructor(status: number, message: string, reason?: string) {
    super(message);
    this.status = status;
    this.reason = reason;
  }
}

/** Spring puts the CSRF token in a readable cookie; every non-GET request must echo it back. */
function readCsrfToken(): string | undefined {
  const value = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  return value === undefined ? undefined : decodeURIComponent(value);
}

function headersFor(method: string, hasBody: boolean): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (hasBody) headers["Content-Type"] = "application/json";
  const token = method === "GET" ? undefined : readCsrfToken();
  if (token) headers["X-XSRF-TOKEN"] = token;
  return headers;
}

/** The API answers errors as RFC 9457 problem details: { status, title, detail, reason }. */
async function errorFrom(response: Response): Promise<ApiError> {
  let message = FALLBACK_MESSAGES[response.status] ?? "Something went wrong. Try again.";
  let reason: string | undefined;
  try {
    const data = await response.json();
    if (typeof data?.detail === "string" && data.detail.length > 0) message = data.detail;
    if (typeof data?.reason === "string") reason = data.reason;
  } catch {
    // empty or non-JSON body: keep the fallback message
  }
  return new ApiError(response.status, message, reason);
}

/** `keepalive`: the request still goes out while the page is closing. An empty answer reads as null. */
async function request<T>(method: string, path: string, body?: unknown, keepalive = false): Promise<T> {
  const init: RequestInit = { method, headers: headersFor(method, body !== undefined), credentials: "same-origin" };
  if (body !== undefined) init.body = JSON.stringify(body);
  if (keepalive) init.keepalive = true;
  const response = await fetch(path, init);
  if (!response.ok) throw await errorFrom(response);
  return JSON.parse((await response.text()) || "null");
}

export const api = {
  me: () => request<Me>("GET", "/api/me"),
  logout: () => request<void>("POST", "/api/auth/logout"),
  requestAccess: (message: string) =>
    request<void>("POST", "/api/access-requests", { message: message.trim() || null }),

  streams: {
    current: () => request<StreamsState>("GET", "/api/streams"),
    start: (kind: StreamKind, connection: SharingConnection, settings: StreamSettings) =>
      request<StreamsState>("POST", "/api/streams", { kind, ...connection, ...settings }),
    settings: (kind: StreamKind, settings: StreamSettings) =>
      request<StreamsState>("POST", `/api/streams/${kind}/settings`, settings),
    stop: (kind: StreamKind) => request<StreamsState>("POST", `/api/streams/${kind}/stop`),
    /** What's on my stage: someone's screen or camera, or null for an empty stage. */
    watching: (target: { sharerId: number; kind: StreamKind } | null) =>
      request<void>("PUT", "/api/streams/watching", target ?? {}),
  },

  room: {
    /**
     * Asks for a seat, or polls the queue. A page already connected to LiveKit says on
     * which connection: after an API restart, that confirms its seat.
     */
    enter: (participantSid?: string) =>
      request<SeatStatus>("POST", "/api/room/enter", participantSid ? { participantSid } : undefined),
    /** Takes the seat held for me. */
    accept: () => request<SeatStatus>("POST", "/api/room/accept"),
    /** Leaves the queue, or turns the seat down. */
    cancel: () => request<void>("POST", "/api/room/cancel"),
    /** The waiting page is closing: keep my place for 30 seconds. */
    leave: () => request<void>("POST", "/api/room/leave", undefined, true),
  },

  liveKitToken: () => request<LiveKitAccess>("POST", "/api/livekit/token"),

  admin: {
    pendingRequests: () => request<AccessRequestView[]>("GET", "/api/admin/access-requests"),
    approve: (id: number) => request<void>("POST", `/api/admin/access-requests/${id}/approve`),
    decline: (id: number) => request<void>("POST", `/api/admin/access-requests/${id}/decline`),
    members: () => request<MemberView[]>("GET", "/api/admin/members"),
    removeMember: (id: number) => request<void>("DELETE", `/api/admin/members/${id}`),
  },
};
