/** How one request is sent: kept alive while the page closes, or given up on through a signal. */
export interface RequestOptions {
  keepalive?: boolean | undefined;
  signal?: AbortSignal | undefined;
}
