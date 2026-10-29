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
  WatchingTarget,
} from "./types/api.types";
import { DEFAULT_ERROR_MESSAGE, FALLBACK_MESSAGES } from "./constants/api.constants";
import { csrfTokenFrom } from "./utils/csrf-token.util";
import { requestHeaders } from "./utils/request-headers.util";

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

/** Talks to the API: every call, its headers and its errors. `api` is the one instance. */
class ApiClient {
  readonly me = () => this.#request<Me>("GET", "/api/me");
  readonly logout = () => this.#request<void>("POST", "/api/auth/logout");
  readonly requestAccess = (message: string) =>
    this.#request<void>("POST", "/api/access-requests", { message: message.trim() || null });

  readonly streams = {
    current: () => this.#request<StreamsState>("GET", "/api/streams"),
    start: (kind: StreamKind, connection: SharingConnection, settings: StreamSettings) =>
      this.#request<StreamsState>("POST", "/api/streams", { kind, ...connection, ...settings }),
    settings: (kind: StreamKind, settings: StreamSettings) =>
      this.#request<StreamsState>("POST", `/api/streams/${kind}/settings`, settings),
    stop: (kind: StreamKind) => this.#request<StreamsState>("POST", `/api/streams/${kind}/stop`),
    /** What's on my stage: someone's screen or camera, or null for an empty stage. */
    watching: (target: WatchingTarget) => this.#request<void>("PUT", "/api/streams/watching", target ?? {}),
  };

  readonly room = {
    /**
     * Asks for a seat, or polls the queue. A page already connected to LiveKit says on
     * which connection: after an API restart, that confirms its seat.
     */
    enter: (participantSid?: string) =>
      this.#request<SeatStatus>("POST", "/api/room/enter", participantSid ? { participantSid } : undefined),
    /** Takes the seat held for me. */
    accept: () => this.#request<SeatStatus>("POST", "/api/room/accept"),
    /** Leaves the queue, or turns the seat down. */
    cancel: () => this.#request<void>("POST", "/api/room/cancel"),
    /** The waiting page is closing: keep my place for 30 seconds. */
    leave: () => this.#request<void>("POST", "/api/room/leave", undefined, true),
  };

  readonly liveKitToken = () => this.#request<LiveKitAccess>("POST", "/api/livekit/token");

  readonly admin = {
    pendingRequests: () => this.#request<AccessRequestView[]>("GET", "/api/admin/access-requests"),
    approve: (id: number) => this.#request<void>("POST", `/api/admin/access-requests/${id}/approve`),
    decline: (id: number) => this.#request<void>("POST", `/api/admin/access-requests/${id}/decline`),
    members: () => this.#request<MemberView[]>("GET", "/api/admin/members"),
    removeMember: (id: number) => this.#request<void>("DELETE", `/api/admin/members/${id}`),
  };

  /** `keepalive`: the request still goes out while the page is closing. An empty answer reads as null. */
  async #request<T>(method: string, path: string, body?: unknown, keepalive = false): Promise<T> {
    const token = method === "GET" ? undefined : this.#csrfToken();
    const init: RequestInit = {
      method,
      headers: requestHeaders(body !== undefined, token),
      credentials: "same-origin",
    };
    if (body !== undefined) init.body = JSON.stringify(body);
    if (keepalive) init.keepalive = true;
    const response = await fetch(path, init);
    if (!response.ok) throw await this.#errorFrom(response);
    return JSON.parse((await response.text()) || "null");
  }

  /** The API answers errors as RFC 9457 problem details: { status, title, detail, reason }. */
  async #errorFrom(response: Response): Promise<ApiError> {
    let message = FALLBACK_MESSAGES[response.status] ?? DEFAULT_ERROR_MESSAGE;
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

  /** Spring puts the CSRF token in a readable cookie; every non-GET request must echo it back. */
  #csrfToken(): string | undefined {
    return csrfTokenFrom(document.cookie);
  }
}

export const api = new ApiClient();
