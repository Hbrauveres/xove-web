import type { Meta, StoryObj } from "@storybook/react-vite";
import { useHearing } from "../../../hooks/use-hearing.hook";
import { useStage } from "../../../hooks/use-stage.hook";
import type { Sharer } from "../../../types/room-view.types";
import { StageInfo } from "./stage-info.component";

const noop = () => undefined;
/** A track that plays nothing. */
const silence = { attach: (el: HTMLMediaElement) => el, detach: (el: HTMLMediaElement) => el };
const live = (id: string, name: string, hue: number): Sharer => ({
  person: { id, name, hue, online: true },
  isMe: false,
  since: 0,
  screen: {
    kind: "screen",
    startedAt: 0,
    settings: { quality: "1080p", mode: "sharp" },
    remote: { video: silence, setQuality: noop },
  },
});

/** The row under the stage, its pick and hearing kept by the room's own hooks. */
function Row({ sharers }: { sharers: Sharer[] }) {
  const stage = useStage(sharers);
  const hearing = useHearing(sharers, stage.big?.person.id ?? null);
  return (
    <div style={{ width: "var(--card-width)" }}>
      <StageInfo
        sharers={[]}
        stage={stage}
        hearing={hearing}
        places={6}
        free={6}
        here={[{ id: "ana", name: "Ana", hue: 300, online: true }]}
      />
    </div>
  );
}

const meta = {
  title: "Room/Stage info",
  component: Row,
  args: { sharers: [] },
} satisfies Meta<typeof Row>;

export default meta;

/** Nobody live: who's here, and the seats. */
export const NobodyLive: StoryObj<typeof meta> = {};
/** Bruno on the stage, Ana's screen beside it. */
export const TwoLive: StoryObj<typeof meta> = {
  args: { sharers: [live("bruno", "Bruno", 30), live("ana", "Ana", 300)] },
};
