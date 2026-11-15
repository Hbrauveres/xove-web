import type { MemberView } from "@services/xove-api-service";

export interface AdminMembersProps {
  members: MemberView[];
  busy: boolean;
  /** The member whose removal is being asked about. */
  asking: number | null;
  onAsk: (id: number | null) => void;
  onRemove: (id: number) => void;
}
