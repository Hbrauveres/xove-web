import { api, apiErrorMessage } from "@services/xove-api-service";
import { ACTION_FAILED, LOAD_FAILED } from "./constants/admin.constants";
import type { AdminState } from "./types/admin.types";

/** Admin's lists and its actions: one action at a time, its error kept, both lists reloaded after each. */
export class AdminStore {
  private state: AdminState = { lists: null, error: null, busy: false };
  private readonly listeners = new Set<() => void>();

  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly getState = () => this.state;

  /** Both lists, from the API. */
  readonly load = async () => {
    try {
      const [requests, members] = await Promise.all([api.admin.pendingRequests(), api.admin.members()]);
      this.set({ lists: { requests, members } });
    } catch (err) {
      this.set({ error: apiErrorMessage(err, LOAD_FAILED) });
    }
  };

  readonly approve = (id: number) => this.act(() => api.admin.approve(id));
  readonly decline = (id: number) => this.act(() => api.admin.decline(id));
  readonly remove = (id: number) => this.act(() => api.admin.removeMember(id));

  private async act(action: () => Promise<void>) {
    this.set({ busy: true, error: null });
    try {
      await action();
    } catch (err) {
      this.set({ error: apiErrorMessage(err, ACTION_FAILED) });
    } finally {
      this.set({ busy: false });
      await this.load();
    }
  }

  private set(change: Partial<AdminState>) {
    this.state = { ...this.state, ...change };
    for (const listener of this.listeners) listener();
  }
}
