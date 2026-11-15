import type { AccessRequestView } from "@services/xove-api-service";

export interface AdminRequestsProps {
  requests: AccessRequestView[];
  busy: boolean;
  onApprove: (id: number) => void;
  onDecline: (id: number) => void;
}
