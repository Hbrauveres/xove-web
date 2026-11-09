import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@shared/stores/auth-store";
import { WaitingRoom } from "../../../../components/room/WaitingRoom";
import { RoomFooter } from "../../../../components/room/RoomFooter";
import { useDeviceList } from "./hooks/use-device-list.hook";
import { useSoundUnlock } from "./hooks/use-sound-unlock.hook";
import { RoomSessionProvider } from "../../stores/room-session";
import { useRoomSeat, useRoomStore } from "../../stores/room-store";
import { roomEntry } from "./utils/room-entry.util";
import { Header } from "../header";
import { RoomError } from "../room-error";
import { Stage } from "../stage";
import styles from "./room-page.page.module.css";
import type { RoomPageProps } from "./types/room-page.types";

/**
 * The whole app is one room: the stage, its controls, and who's here. Members only; whoever comes
 * when every seat is taken waits for one. Once I'm in, the page only lays the room out: each area
 * reads its own part of the room.
 */
export function RoomPage({ pollMs }: RoomPageProps = {}) {
  const { signOut, state } = useAuth();
  const navigate = useNavigate();
  const me = state.status === "signedIn" ? state.me : null;
  const room = useRoomStore(me?.name ?? me?.email ?? "You", pollMs);
  const seat = useRoomSeat(room.store, room.model);
  // From the waiting room on: a click while waiting already unlocks the sound.
  useSoundUnlock(room.store.video.unlockAudio);
  // The names show once a camera or mic is allowed: list them again then.
  const devices = useDeviceList(`${room.video.publishing.camera}-${room.video.voice}`);
  const onSignOut = useCallback(async () => {
    await signOut();
    navigate("/", { replace: true });
  }, [signOut, navigate]);

  const entry = roomEntry(room.model, room.video);
  if (!entry.ready) return <WaitingRoom seat={{ ...seat, status: entry.waiting }} onSignOut={onSignOut} />;
  return (
    <RoomSessionProvider room={room} devices={devices} onSignOut={onSignOut}>
      <div className={styles.theater} data-room>
        <Header />
        {/* One column as wide as the stage can be: the stage and its info row share its edges. */}
        <main className={styles.middle}>
          <div className={styles.column}>
            <Stage />
          </div>
          <RoomError />
        </main>
        <RoomFooter />
      </div>
    </RoomSessionProvider>
  );
}
