import { floatingStore } from "@shared/stores/floating-store";

/** The old calls, on the floating store, until every piece is on it. */
const entries = new Map<() => void, Parameters<typeof floatingStore.add>[0]>();

export function claimFloating(close: () => void, area?: Element | null) {
  const entry = entries.get(close) ?? { kind: "rest" as const, close, area: () => area ?? null };
  entry.area = () => area ?? null;
  entries.set(close, entry);
  floatingStore.add(entry);
}

export function releaseFloating(close: () => void) {
  const entry = entries.get(close);
  if (entry) floatingStore.remove(entry);
  entries.delete(close);
}

export function dismissFloating(keep?: () => void) {
  floatingStore.clearForRest(keep);
}

export function resetFloating() {
  entries.clear();
  floatingStore.reset();
}
