import type { StreamSettings } from "@core/api/types/api.types";

export type ChangeWindowInputs = {
  /** Picks another window or tab into my screen: viewers keep the same stream. */
  changeScreen: (settings: StreamSettings) => Promise<{ hasSound: boolean } | null>;
  screen: StreamSettings;
  /** The new pick's sound may come or go. */
  onSound: (hasSound: boolean) => void;
};
