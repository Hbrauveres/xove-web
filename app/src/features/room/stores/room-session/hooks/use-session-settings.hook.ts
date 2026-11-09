import { useMemo } from "react";
import { canShareScreen } from "@services/media-devices-service";
import type { SettingsPanelProps } from "../../../../../components/stage/SettingsPanel";
import type { SessionCore, SettingsOpen } from "../types/room-session.types";

/** The settings panel's part: what I send and how, my devices, and my voice. */
export function useSessionSettings(core: SessionCore, settings: SettingsOpen): SettingsPanelProps {
  const { video } = core;
  return useMemo(
    () => ({
      open: settings.open,
      onClose: settings.close,
      screenTab: canShareScreen(),
      mine: core.mine,
      prefs: core.prefs,
      onPrefsChange: core.setPrefs,
      screenSurface: video.screenSurface,
      noSound: core.noSound,
      onChangeWindow: core.changeScreen,
      cameras: core.cameras,
      cameraId: core.cameraId,
      onPickCamera: core.pickCamera,
      cameraVideo: core.mine.camera ? video.local.camera : core.cameraPreview,
      onPreviewCamera: core.previewCamera,
      cameraProblem: video.cameraProblem,
      busy: core.busy,
      goTo: settings.goTo,
      voice: video.voice,
      voicePrefs: core.voicePrefs,
      onVoicePrefs: core.setVoicePrefs,
      mics: core.mics,
      localVoice: video.localVoice,
      micInput: video.micInput,
    }),
    [core, video, settings],
  );
}
