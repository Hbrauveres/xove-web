import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { LabelPill } from "./label-pill.component";
import styles from "./label-pill.component.module.css";

it("shows its lead, then its words", () => {
  const { container } = render(<LabelPill lead={<i>face</i>}>Ana · camera</LabelPill>);
  expect(container.firstElementChild).toHaveTextContent(/^faceAna · camera$/);
});

it("is a glass pill of the small size unless told otherwise", () => {
  const { container } = render(<LabelPill>Only you see this</LabelPill>);
  const pill = container.firstElementChild?.className.split(" ");
  expect(pill).toEqual(expect.arrayContaining([styles.glass, styles.s]));
});

it("takes a tone and a size: the red tint for a status, solid red for a role, grey for a quiet status", () => {
  const { container } = render(
    <>
      <LabelPill tone="soft" size="m">
        Waiting for approval
      </LabelPill>
      <LabelPill tone="solid">Admin</LabelPill>
      <LabelPill tone="quiet" size="m">
        Reconnecting
      </LabelPill>
    </>,
  );
  const [waiting, admin, reconnecting] = [...container.children];
  expect(waiting?.className.split(" ")).toEqual(expect.arrayContaining([styles.soft, styles.m]));
  expect(admin?.className.split(" ")).toEqual(expect.arrayContaining([styles.solid, styles.s]));
  expect(reconnecting?.className.split(" ")).toEqual(expect.arrayContaining([styles.quiet, styles.m]));
});
