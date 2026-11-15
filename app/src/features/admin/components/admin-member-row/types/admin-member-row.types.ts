import type { MemberView } from "@services/xove-api-service";

export interface AdminMemberRowProps {
  member: MemberView;
  /** Another action is running. */
  busy: boolean;
  /** Removes this member (never an admin). */
  onRemove: (id: number) => Promise<void>;
}
