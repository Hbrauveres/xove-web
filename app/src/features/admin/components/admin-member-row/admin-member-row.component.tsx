import { Face } from "@shared/components/face";
import { LabelPill } from "@shared/components/label-pill";
import { PersonRow } from "@shared/components/person-row";
import { AdminRemoveConfirm } from "../admin-remove-confirm";
import styles from "./admin-member-row.component.module.css";
import type { AdminMemberRowProps } from "./types/admin-member-row.types";
import { firstName } from "./utils/first-name.util";

/** A member: their face, name and email, and Remove; an admin says Admin instead. */
export function AdminMemberRow({ member, busy, onRemove }: AdminMemberRowProps) {
  return (
    <li className={styles.member}>
      <PersonRow
        face={<Face name={member.name || member.email} photo={member.avatarUrl} size={32} />}
        name={member.name ?? member.email}
        line={member.email}
        end={
          member.admin ? (
            <LabelPill tone="solid">Admin</LabelPill>
          ) : (
            <AdminRemoveConfirm firstName={firstName(member.name)} busy={busy} onRemove={() => onRemove(member.id)} />
          )
        }
      />
    </li>
  );
}
