import type { ComponentProps, ReactNode } from "react";
import type { DeviceList } from "@services/media-devices-service";
import type { HeaderActivityPill } from "../../../components/header/header-activity-pill";
import type { HeaderMyPictureButton } from "../../../components/header/header-my-picture-button";
import type { HeaderPeopleButton } from "../../../components/header/header-people-button";
import type { AmbilightPrefs } from "@services/preferences-service";
import type { StreamKind } from "@services/xove-api-service";
import type { Friend, Sharer } from "../../../types/room-view.types";
import type { RoomStoreValue } from "./room-store.types";
import type { StagePick } from "../../../types/stage.types";
import type { StreamControls } from "../../../types/stream-controls.types";
import type { SettingsGoTo, SettingsSession } from "../../../types/settings.types";
import type { useSessionCore } from "../hooks/use-session-core.hook";

/** What the room's page hands the session once I'm in. */
export type RoomSessionProviderProps = {
  room: RoomStoreValue;
  /** The browser's cameras and mics, listed by the page from the waiting room on. */
  devices: DeviceList;
  onSignOut: () => void;
  children: ReactNode;
};

/** The room as its hooks give it: my streams, my voice, the people, the activity, my devices. */
export type SessionCore = ReturnType<typeof useSessionCore>;

/** The settings panel: open or not, and the setting a live button's gesture asked for. */
export type SettingsOpen = {
  open: boolean;
  toggle: () => void;
  close: () => void;
  goTo: SettingsGoTo | undefined;
  goToSetting: (kind: StreamKind) => void;
};

/** Who I am to the room's menu: an admin or not, and signing out. */
export type Account = { isAdmin: boolean; onSignOut: () => void };

/** The light round the stage, and changing it. */
export type Light = { value: AmbilightPrefs; change: (prefs: AmbilightPrefs) => void };

/** The header's pieces: the activity in the middle, people and my account at the right. */
export type HeaderSession = {
  activity: ComponentProps<typeof HeaderActivityPill>;
  people: ComponentProps<typeof HeaderPeopleButton>;
  me: ComponentProps<typeof HeaderMyPictureButton>;
};

/** What each person shares, by their id. */
export type SharingOf = HeaderSession["people"]["sharing"];

/** The stage: who's live, who's on it, its light, who watches it, and my buttons on it. */
export type StageSession = {
  sharers: Sharer[];
  stage: StagePick;
  ambilight: AmbilightPrefs;
  /** Who has the person on the stage on theirs, me included, never that person. */
  watchers: Friend[];
  /** The others in the room, for the empty stage's row. */
  others: Friend[];
  controls: StreamControls;
};

/** What the room's areas read: each its own part, shaped as its pieces take it. */
export type RoomSession = {
  header: HeaderSession;
  stage: StageSession;
  settings: SettingsSession;
  /** The room's problem, said under the stage (or over the player in fullscreen). */
  error: string | null;
};
