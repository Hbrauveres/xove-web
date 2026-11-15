import type { MemberView } from "@services/xove-api-service";

export interface AdminMembersProps {
  members: MemberView[];
  busy: boolean;
  onRemove: (id: number) => Promise<void>;
}
