import { useEffect, useState, useSyncExternalStore } from "react";
import { AdminStore } from "../admin.store";

/** Admin's lists and actions, for this visit: a store of its own, loaded as the page opens. */
export function useAdmin() {
  const [store] = useState(() => new AdminStore());
  const state = useSyncExternalStore(store.subscribe, store.getState);
  useEffect(() => {
    void store.load();
  }, [store]);
  return { ...state, approve: store.approve, decline: store.decline, remove: store.remove };
}
