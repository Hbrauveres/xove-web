import type { StreamKind } from "@services/xove-api-service";
import type { SettingsStream } from "../../../../types/settings.types";

export type SettingsQualityModeProps = SettingsStream & { kind: StreamKind };
