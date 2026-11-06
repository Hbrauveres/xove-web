import type { AppConfig } from "../types/app-config.types";

/** Where the web app's own server serves its settings, filled in from its environment. */
export const APP_CONFIG_URL = "/config.json";

/** The most streams the room is drawn for: a larger setting would need the room's own design first. */
export const MAX_STREAM_PLACES = 6;

/** Nothing said: every reader falls back to what the API's answers say. */
export const NO_APP_CONFIG: AppConfig = { streamPlaces: null };

/** How long the app waits for its settings before it shows without them. */
export const APP_CONFIG_WAIT_MS = 3000;
