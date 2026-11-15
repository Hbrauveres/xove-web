import type { AccessRequestView, MemberView } from "@services/xove-api-service";

/** Who's waiting to get in, and who's in. */
interface AdminLists {
  requests: AccessRequestView[];
  members: MemberView[];
}

export interface AdminState {
  /** None until the first load answers. */
  lists: AdminLists | null;
  /** What went wrong last, in words to show. */
  error: string | null;
  /** An action is running: the others wait for it. */
  busy: boolean;
  /** The member whose removal is being asked about: one at a time, closed when any action ends. */
  asking: number | null;
}
