import { useEffect, useState } from "react";
import { listDevices, watchDevices } from "@core/devices/device-list.service";
import type { DeviceList } from "@core/devices/types/devices.types";
import { NO_DEVICES } from "@core/devices/constants/devices.constants";

/**
 * The browser's cameras and mics, kept up to date as devices come and go. Read again when
 * `refresh` changes: the browser only shows their names once a camera or mic is allowed.
 */
export function useDeviceList(refresh: unknown): DeviceList {
  const [devices, setDevices] = useState<DeviceList>(NO_DEVICES);
  useEffect(() => {
    let current = true;
    const list = () =>
      listDevices().then(
        (found) => current && setDevices(found),
        () => {
          /* No list: the menus just show none. */
        },
      );
    void list();
    const stop = watchDevices(() => void list());
    return () => {
      current = false;
      stop();
    };
  }, [refresh]);
  return devices;
}
