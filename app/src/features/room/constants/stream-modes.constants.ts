import type { StreamMode } from "@core/api/types/api.types";

/** The modes, plain, as the settings show them, with what each keeps in their tooltips. */
export const MODE_OPTIONS: { value: StreamMode; label: string; title: string }[] = [
  { value: "smooth", label: "Smooth", title: "Keeps motion fluid when the connection is tight: games, videos" },
  { value: "sharp", label: "Sharp", title: "Keeps detail sharp when the connection is tight: text, code" },
];
