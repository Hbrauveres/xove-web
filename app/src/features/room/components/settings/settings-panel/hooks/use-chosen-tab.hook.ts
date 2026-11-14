import { useCallback, useState } from "react";
import type { SettingsGoTo, SettingsTab } from "../../../../types/settings.types";

/**
 * The tab shown: the last of a click and a live button's request (each remembers the request it
 * came after), never one that can't be used; a request from before the panel was there doesn't count.
 */
export function useChosenTab(goTo: SettingsGoTo | undefined, usable: SettingsTab[]) {
  const [picked, setPicked] = useState(() => ({ tab: usable[0] ?? "camera", after: goTo?.n ?? 0 }));
  const asked = goTo && goTo.n > picked.after && usable.includes(goTo.kind) ? goTo.kind : undefined;
  const wanted = asked ?? picked.tab;
  const tab: SettingsTab = usable.includes(wanted) ? wanted : (usable[0] ?? "camera");
  const after = goTo?.n ?? 0;
  const choose = useCallback((next: SettingsTab) => setPicked({ tab: next, after }), [after]);
  return { tab, choose };
}
