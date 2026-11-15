import type { FormEvent } from "react";
import { Button } from "@shared/components/button";
import { ErrorNotice } from "@shared/components/error-notice";
import { Field } from "@shared/components/field";
import { Headline } from "@shared/components/headline";
import { PageText } from "@shared/components/page-text";
import { MESSAGE_MAX } from "./constants/request-access-form.constants";
import { useAccessRequest } from "./hooks/use-access-request.hook";
import styles from "./request-access-form.component.module.css";
import type { RequestAccessFormProps } from "./types/request-access-form.types";

/** "You need access": ask once, with an optional note; or ask again after a decline. */
export function RequestAccessForm({ declined, onSent }: RequestAccessFormProps) {
  const { message, setMessage, sending, error, send } = useAccessRequest(onSent);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void send();
  };

  return (
    <>
      <Headline level="page" className={styles.title}>
        {declined ? "Your request was declined" : "You need access"}
      </Headline>
      <PageText variant="lead">
        {declined
          ? "The owner declined your last request. If you think that was a mistake, you can ask again with a note."
          : "Xovê is invite only. Ask for access and the owner will get your request."}
      </PageText>
      <form className={styles.form} onSubmit={submit}>
        <Field
          label="Message"
          hint="(optional)"
          id="access-message"
          rows={3}
          maxLength={MESSAGE_MAX}
          placeholder="Hey, it's me from…"
          value={message}
          onChange={setMessage}
          action={
            <Button type="submit" disabled={sending}>
              {sending ? "Sending…" : declined ? "Ask again" : "Request access"}
            </Button>
          }
        />
        {error && <ErrorNotice>{error}</ErrorNotice>}
      </form>
    </>
  );
}
