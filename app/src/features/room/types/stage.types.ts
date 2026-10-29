import type { useStage } from "../hooks/use-stage.hook";
import type { PersonId } from "./room.types";

/** Who I picked for my stage, and when their streams then live had started. */
export type Pick = { personId: PersonId; streams: number[] };

export type StagePick = ReturnType<typeof useStage>;
