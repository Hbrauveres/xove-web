import type { ReactNode } from "react";
import { RoomSessionProvider } from "@features/room/stores/room-session";
import { useRoomStore } from "@features/room/stores/room-store";
import { useDeviceList } from "@features/room/components/room/room-page/hooks/use-device-list.hook";

/** The room as the page gives it to its areas, on the fake API and LiveKit, once I'm seated and named. */
export function LiveRoom({ children, onSignOut }: { children: ReactNode; onSignOut: () => void }) {
  // Asks the fake API fast, so tests don't wait 2 seconds.
  const room = useRoomStore("Henrique Brauveres", 50);
  const devices = useDeviceList(`${room.video.publishing.camera}-${room.video.voice}`);
  if (room.model.seat?.status !== "in" || room.model.me === null) return null;
  return (
    <RoomSessionProvider room={room} devices={devices} onSignOut={onSignOut}>
      {children}
    </RoomSessionProvider>
  );
}
