/** The settings the web app's own server hands it in `/config.json`, shared with the API. */
export type AppConfig = {
  /** How many streams can be live at once, 1 to 6; null when the file didn't say (or said it wrong). */
  streamPlaces: number | null;
};
