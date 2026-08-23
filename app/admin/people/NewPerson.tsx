"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Field, Icon, Panel, Problem } from "@/components/admin/ui";
import { addPerson, invitePerson } from "./actions";

/**
 * Somebody new, from the top of the list.
 *
 * Two ways in, and they are genuinely different things rather than two names for
 * one. **Written down** puts somebody on the community page and asks nothing of
 * them, which is what most of this club is: the names on the wall are older than
 * the idea of accounts here. **Invited** does the same and also sends them a way
 * in — and that is the only way an account gets made now, the public join page
 * having been taken down.
 *
 * A panel that opens under the title rather than a form sitting at the top of the
 * page: adding somebody happens about once a month, and reading the list happens
 * every day.
 */
export default function NewPerson() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [problem, setProblem] = useState("");
  const [said, setSaid] = useState("");
  const [busy, start] = useTransition();

  function write(alsoInvite: boolean) {
    setProblem("");
    setSaid("");
    start(async () => {
      const answer = alsoInvite
        ? await invitePerson({ id: null, name, email })
        : await addPerson({ name, country });
      if (!answer.ok) {
        setProblem(answer.error ?? "That did not save.");
        return;
      }
      setName("");
      setCountry("");
      setEmail("");
      setSaid(alsoInvite ? "Written down, and sent a way in." : "Written down.");
      /* Straight into the list rather than into their page: somebody written down
         from here is a name and a country, and there is nothing to fill in yet
         that this panel has not already asked for. */
      router.refresh();
    });
  }

  return (
    <>
      <Button onClick={() => setOpen((was) => !was)}>
        <Icon name="plus" />
        {open ? "never mind" : "add somebody"}
      </Button>

      {open ? (
        <Panel
          name="somebody new"
          hint="A name is enough. Add an address as well and they are also sent a way in — that is the only way an account gets made now."
        >
          <div className="admin-fields">
            <Field label="name">
              <input
                value={name}
                onChange={(change) => setName(change.target.value)}
                placeholder="Anna Bauer"
                autoComplete="off"
              />
            </Field>
            <Field label="country">
              <input
                value={country}
                onChange={(change) => setCountry(change.target.value)}
                placeholder="Switzerland"
                autoComplete="off"
              />
            </Field>
            <Field
              label="their email address"
              hint="Only if they should be sent a way in."
            >
              <input
                type="email"
                value={email}
                onChange={(change) => setEmail(change.target.value)}
                placeholder="anna@wherever.com"
                autoComplete="off"
              />
            </Field>
          </div>

          {problem ? <Problem>{problem}</Problem> : null}
          {said ? <p className="admin-ok">{said}</p> : null}

          <div className="admin-doing">
            <Button onClick={() => write(false)} disabled={busy || !name.trim()}>
              write them down
            </Button>
            <Button
              onClick={() => write(true)}
              disabled={busy || !name.trim() || !email.includes("@")}
            >
              write down and invite
            </Button>
          </div>
        </Panel>
      ) : null}
    </>
  );
}
