import { useCallback, useMemo, useState } from "react";
import type { StreamKind, StreamSettings } from "@core/api/types/api.types";
import { loadAllStreamSettings, saveStreamSettings } from "@core/preferences/preferences.service";
import { SettingsQueue } from "../state/settings-queue.service";
import type { StreamSettingsInputs } from "../types/stream-settings.types";

/**
 * How I send my screen and my camera, remembered. While live, a new quality or mode applies at
 * once: to the video right away, and to the API, which tells every viewer's app. Changes go one
 * after another; a refused one puts the last accepted settings back.
 */
export function useStreamSettings({ live, publishing, applySettings, changeAtApi }: StreamSettingsInputs) {
  const [prefs, setPrefsState] = useState(loadAllStreamSettings);
  const [queue] = useState(() => new SettingsQueue(prefs));

  const remember = useCallback((kind: StreamKind, settings: StreamSettings) => {
    setPrefsState((prev) => ({ ...prev, [kind]: settings }));
    saveStreamSettings(kind, settings);
  }, []);

  const setPrefs = useCallback(
    (kind: StreamKind, next: StreamSettings) => {
      remember(kind, next);
      if (!(live[kind] && publishing[kind])) return;
      void queue
        .change(
          kind,
          next,
          async (settings) => {
            await applySettings(kind, settings);
            return changeAtApi(kind, settings);
          },
          async (back) => {
            await applySettings(kind, back);
            remember(kind, back);
          },
        )
        .catch(() => {
          /* A change that failed on its way: the next one goes on; the settings shown stay mine. */
        });
    },
    [live, publishing, applySettings, changeAtApi, queue, remember],
  );

  return useMemo(() => ({ prefs, setPrefs, queue }), [prefs, setPrefs, queue]);
}
