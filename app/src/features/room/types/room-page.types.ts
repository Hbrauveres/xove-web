import type { DeviceList } from "@services/media-devices-service/types/devices.types";
import type { RememberedCamera } from "./remembered-camera.types";
import type { RoomStoreValue } from "./room-store.types";

/** What the room's page gives the room once I'm in: the store, the devices, the camera, and signing out. */
export type RoomPageProps = {
  room: RoomStoreValue;
  devices: DeviceList;
  camera: RememberedCamera;
  onSignOut: () => void;
};
