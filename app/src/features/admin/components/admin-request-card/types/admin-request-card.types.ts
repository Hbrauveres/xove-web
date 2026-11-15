import type { AccessRequestView } from "@services/xove-api-service";

export interface AdminRequestCardProps {
  request: AccessRequestView;
  /** Another action is running: Approve and Decline wait. */
  busy: boolean;
  onApprove: (id: number) => void;
  onDecline: (id: number) => void;
}
