import type { StreamKind, StreamSettings } from "@services/xove-api-service/types/api.types";

/**
 * Changes to my streams' settings while live, one after another, in the order they were made.
 * Each change is applied; when one is refused, the last accepted settings go back, unless a newer
 * change of the same stream follows (that one decides). One that fails on its way doesn't block the next.
 */
export class SettingsQueue {
  private accepted: Record<StreamKind, StreamSettings>;
  private readonly latest: Record<StreamKind, number> = { screen: 0, camera: 0 };
  private chain: Promise<void> = Promise.resolve();

  constructor(accepted: Record<StreamKind, StreamSettings>) {
    this.accepted = { ...accepted };
  }

  /** The settings the API last accepted for a stream. */
  acceptedFor(kind: StreamKind): StreamSettings {
    return this.accepted[kind];
  }

  /** A stream started, or the API took its settings: what a refused change goes back to. */
  accept(kind: StreamKind, settings: StreamSettings): void {
    this.accepted = { ...this.accepted, [kind]: settings };
  }

  /**
   * Queues a change: `apply` sends it and says whether it was accepted; `putBack` restores the
   * last accepted settings after a refusal. Resolves once this change is done.
   */
  change(
    kind: StreamKind,
    next: StreamSettings,
    apply: (settings: StreamSettings) => Promise<boolean>,
    putBack: (settings: StreamSettings) => Promise<void>,
  ): Promise<void> {
    const id = ++this.latest[kind];
    const step = this.chain.then(async () => {
      if (await apply(next)) {
        this.accept(kind, next);
        return;
      }
      if (id === this.latest[kind]) await putBack(this.accepted[kind]);
    });
    // A change that failed on its way (the connection) doesn't stop the ones after it.
    this.chain = step.catch(() => {});
    return step;
  }
}
