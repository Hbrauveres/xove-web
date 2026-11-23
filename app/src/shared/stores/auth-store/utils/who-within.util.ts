import { api } from "@services/xove-api-service";
import type { Me } from "@services/xove-api-service";

/** Asks the API who's signed in, giving up after `ms`: a wait that long counts as no answer. */
export async function whoWithin(ms: number): Promise<Me> {
  const give = new AbortController();
  const giveUp = setTimeout(() => give.abort(new DOMException("No answer in time", "TimeoutError")), ms);
  try {
    return await api.me(give.signal);
  } finally {
    clearTimeout(giveUp);
  }
}
