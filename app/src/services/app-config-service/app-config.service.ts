import { APP_CONFIG_URL, APP_CONFIG_WAIT_MS, NO_APP_CONFIG } from "./constants/app-config.constants";
import type { AppConfig } from "./types/app-config.types";
import { parseAppConfig } from "./utils/parse-app-config.util";

/**
 * The settings the web app's own server serves (`/config.json`), shared with the API. They're read
 * once, before the app shows. `appConfig` is the one instance.
 */
class AppConfigService {
  #current: AppConfig = NO_APP_CONFIG;

  /** Reads the file. It never fails: a missing, wrong or slow file leaves the settings unsaid, and
   * each reader falls back to what the API's answers say. The app waits for it, so not for long. */
  async load(): Promise<void> {
    try {
      const answer = await fetch(APP_CONFIG_URL, {
        cache: "no-store",
        signal: AbortSignal.timeout(APP_CONFIG_WAIT_MS),
      });
      this.#current = answer.ok ? parseAppConfig(await answer.json()) : NO_APP_CONFIG;
    } catch {
      this.#current = NO_APP_CONFIG;
    }
  }

  /** The settings as read; unsaid until `load` has run. */
  read(): AppConfig {
    return this.#current;
  }

  /** Back to unread: the tests' shared setup calls it after each test. */
  reset(): void {
    this.#current = NO_APP_CONFIG;
  }
}

export const appConfig = new AppConfigService();
