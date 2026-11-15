import { ApiError } from "../xove-api.service";

/** What to tell the person about a failed call: the API's own words, or the place's when the API didn't answer. */
export function apiErrorMessage(error: unknown, otherwise: string): string {
  return error instanceof ApiError ? error.message : otherwise;
}
