"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Uploader from "@/components/admin/Uploader";
import {
  Button,
  Empty,
  Field,
  Flag,
  Grip,
  Icon,
  Move,
  Place,
  Problem,
  SaveBar,
  Word,
  moved,
  useDragOrder,
} from "@/components/admin/ui";
import { mediaUrl } from "@/lib/supabase/config";
import {
  addAssociation,
  deleteAssociation,
  reorderAssociations,
  saveAssociations,
  setLogo,
} from "./actions";

export type Partner = {
  id: string;
  name: string;
  url: string;
  logo: string | null;
  logoUrl: string | null;
  published: boolean;
};

/**
 * The partners, in the order they stand in.
 *
 * A logo is kept the moment it is uploaded — it is a file, and there is nothing
 * to weigh up about it. The name and the link wait for the save, like every other
 * piece of typing in here.
 */
export default function AssociationList({ initial }: { initial: Partner[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [kept, setKept] = useState(initial);
  const [order, setOrder] = useState(false);
  const [problem, setProblem] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [pending, start] = useTransition();

  const changed = useMemo(
    () => JSON.stringify(rows.map(text)) !== JSON.stringify(kept.map(text)),
    [rows, kept],
  );

  function edit(id: string, patch: Partial<Partner>) {
    setRows((list) => list.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    setJustSaved(false);
  }

  function move(from: number, to: number) {
    const next = moved(rows, from, to);
    if (next === rows) return;
    setRows(next);
    setOrder(true);
  }

  const { dropProps, handleProps, dragging } = useDragOrder(rows, move);

  function save() {
    setProblem("");
    start(async () => {
      const result = await saveAssociations(
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          url: row.url,
          published: row.published,
        })),
      );
      if (!result.ok) {
        setProblem(result.error ?? "That did not save.");
        return;
      }
      setKept(rows);
      setJustSaved(true);
      router.refresh();
    });
  }

  function keepOrder() {
    setProblem("");
    start(async () => {
      const result = await reorderAssociations(rows.map((row) => row.id));
      if (!result.ok) setProblem(result.error ?? "The order did not save.");
      else setOrder(false);
    });
  }

  function add() {
    setProblem("");
    start(async () => {
      const result = await addAssociation();
      if (!result.ok || !result.id) {
        setProblem(result.error ?? "That did not work.");
        return;
      }
      const fresh: Partner = {
        id: result.id,
        name: "",
        url: "",
        logo: null,
        logoUrl: null,
        published: false,
      };
      setRows((list) => [...list, fresh]);
      setKept((list) => [...list, fresh]);
      router.refresh();
    });
  }

  function logo(row: Partner, path: string | null) {
    setProblem("");
    start(async () => {
      const result = await setLogo(row.id, path);
      if (!result.ok) {
        setProblem(result.error ?? "The logo did not save.");
        return;
      }
      const patch = { logo: path, logoUrl: path ? mediaUrl(path) : null };
      edit(row.id, patch);
      setKept((list) => list.map((one) => (one.id === row.id ? { ...one, ...patch } : one)));
      router.refresh();
    });
  }

  function remove(row: Partner) {
    if (!confirm(`Delete ${row.name || "this partner"}? The logo goes too.`)) return;
    setProblem("");
    start(async () => {
      const result = await deleteAssociation(row.id);
      if (!result.ok) {
        setProblem(result.error ?? "That did not delete.");
        return;
      }
      setRows((list) => list.filter((one) => one.id !== row.id));
      setKept((list) => list.filter((one) => one.id !== row.id));
      router.refresh();
    });
  }

  return (
    <>
      <Problem>{problem}</Problem>

      <p style={{ margin: "0 0 18px" }}>
        <Button onClick={add} disabled={pending}>
          <Icon name="plus" />
          add a partner
        </Button>
      </p>

      {order ? (
        <div className="admin-save" style={{ position: "static", marginTop: 0, marginBottom: 16 }}>
          <button type="button" className="admin-btn" onClick={keepOrder} disabled={pending}>
            {pending ? "saving…" : "keep this order"}
          </button>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <Empty>No partners yet.</Empty>
      ) : (
        <ul className="admin-rows">
          {rows.map((row, index) => (
            <li
              key={row.id}
              {...dropProps(row, index)}
              className={[
                "admin-row",
                dragging === row.id ? "admin-row-dragging" : "",
                row.published ? "" : "admin-row-hidden",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ flexWrap: "wrap" }}
            >
              <Grip {...handleProps(row)} />
                  <Place index={index} total={rows.length} onMove={move} />

              <span className="admin-thumb" style={{ width: 74, height: 54 }}>
                {row.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.logoUrl} alt="" draggable={false} style={{ objectFit: "contain" }} />
                ) : (
                  "no logo"
                )}
              </span>

              <span className="admin-row-main" style={{ minWidth: 240 }}>
                <span className="admin-fields">
                  <Field label="name">
                    <input
                      value={row.name}
                      onChange={(event) => edit(row.id, { name: event.target.value })}
                      placeholder="what they are called"
                    />
                  </Field>
                  <Field label="link" hint="Optional. The whole address, https and all.">
                    <input
                      value={row.url}
                      onChange={(event) => edit(row.id, { url: event.target.value })}
                      placeholder="https://…"
                    />
                  </Field>
                </span>
              </span>

              <span
                className="admin-row-side"
                style={{ flexDirection: "column", alignItems: "flex-end", gap: 7 }}
              >
                <Flag
                  on={row.published}
                  onChange={(next) => edit(row.id, { published: next })}
                  labels={["on the page", "hidden"]}
                />
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                  }}
                >
                  <Uploader
                    folder="logos"
                    many={false}
                    label={row.logoUrl ? "another logo" : "a logo"}
                    onDone={async (uploaded) => logo(row, uploaded.path)}
                  />
                  {row.logo ? (
                    <Word danger onClick={() => logo(row, null)} disabled={pending}>
                      no logo
                    </Word>
                  ) : null}
                </span>
                <Move index={index} total={rows.length} onMove={move} />
                <Word danger onClick={() => remove(row)} disabled={pending}>
                  delete
                </Word>
              </span>
            </li>
          ))}
        </ul>
      )}

      {rows.length > 0 ? (
        <SaveBar
          onSave={save}
          pending={pending}
          dirty={changed}
          saved={justSaved}
          label="keep the partners"
        >
          <span className="admin-note" style={{ margin: 0 }}>
            a logo is kept the moment it is uploaded
          </span>
        </SaveBar>
      ) : null}
    </>
  );
}

/** Only the typing, for working out whether anything needs saving. */
function text(row: Partner) {
  return { id: row.id, name: row.name, url: row.url, published: row.published };
}
