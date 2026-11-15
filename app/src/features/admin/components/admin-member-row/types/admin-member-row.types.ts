import type { MemberView } from "@services/xove-api-service";

export interface AdminMemberRowProps {
  member: MemberView;
  /** Another action is running. */
  busy: boolean;
  /** Their removal is being asked about. */
  asking: boolean;
  /** Asks about their removal (their id), or takes the question back (`null`). */
  onAsk: (id: number | null) => void;
  /** Removes this member (never an admin). */
  onRemove: (id: number) => void;
}
