"use server";

import { requireAdminAction } from "@/lib/admin/guard";
import { failed, refreshSite, type Saved } from "@/lib/admin/revalidate";
import { TABLES, type TableName, writableColumns } from "@/lib/admin/tables";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Adding to, changing and clearing out the four list-shaped tables.
 *
 * One set of actions rather than four almost identical ones. A server action is
 * a public endpoint, so the table name and every column are checked against
 * lib/admin/tables.ts before anything is written — the description of the table
 * is also its allowlist. The database has the last word anyway, through the row
 * level security policies, but a nonsense column should be refused here rather
 * than turned into a database error somebody has to read.
 */

export type RowValues = Record<string, string | number | boolean | null>;

function known(table: string): TableName {
  if (table in TABLES) return table as TableName;
  throw new Error(`There is no “${table}” to write to.`);
}

/** Only the columns this table admits, and nothing else. */
function clean(table: TableName, values: RowValues): RowValues {
  const allowed = new Set(writableColumns(table));
  const out: RowValues = {};

  for (const [key, value] of Object.entries(values)) {
    if (!allowed.has(key)) continue;
    const column = TABLES[table].columns.find((one) => one.key === key);

    // A date input hands back "" when it is cleared, which is not a date.
    if (column?.kind === "date") {
      out[key] = typeof value === "string" && value ? value : null;
      continue;
    }
    if (column?.kind === "number") {
      out[key] = Number(value) || 0;
      continue;
    }
    // A story or a picture is either chosen or it is nothing.
    if (column?.kind === "story" || column?.kind === "photo") {
      out[key] = value ? String(value) : null;
      continue;
    }
    out[key] = typeof value === "string" ? value.trim() : value;
  }

  return out;
}

/**
 * The columns a row cannot be without — the ones the database refuses as null,
 * said in words instead of as a constraint violation.
 *
 * Only columns that were actually sent are checked, so this is as true of a
 * change to one field as it is of a brand-new row.
 */
const NEEDED: Record<TableName, [string, string][]> = {
  events: [
    ["happens_on", "An evening needs a day."],
    ["title", "An evening needs a name."],
  ],
  news: [
    ["published_on", "A note needs a date."],
    ["title", "A note needs a title."],
  ],
  quotes: [["text", "A quote needs some words."]],
  donations: [["given_on", "A gift needs a date."]],
};

function missing(table: TableName, values: RowValues): string | null {
  for (const [key, complaint] of NEEDED[table]) {
    if (key in values && !values[key]) return complaint;
  }
  return null;
}

export async function addRow(table: string, values: RowValues): Promise<Saved & { id?: string }> {
  await requireAdminAction();
  const name = known(table);
  const row = clean(name, values);

  const wrong = missing(name, row);
  if (wrong) return { ok: false, error: wrong };

  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from(name)
    .insert(row)
    .select("id")
    .single<{ id: string }>();
  if (error) return failed(error);

  refreshSite();
  return { ok: true, id: data.id };
}

export async function saveRows(
  table: string,
  rows: (RowValues & { id: string })[],
): Promise<Saved> {
  await requireAdminAction();
  const name = known(table);
  const supabase = await supabaseServer();

  for (const row of rows) {
    const { id, ...rest } = row;
    const values = clean(name, rest);
    const wrong = missing(name, { ...values });
    if (wrong) return { ok: false, error: wrong };

    const { error } = await supabase.from(name).update(values).eq("id", id);
    if (error) return failed(error);
  }

  refreshSite();
  return { ok: true };
}

export async function deleteRow(table: string, id: string): Promise<Saved> {
  await requireAdminAction();
  const name = known(table);
  const supabase = await supabaseServer();

  const { error } = await supabase.from(name).delete().eq("id", id);
  if (error) return failed(error);

  refreshSite();
  return { ok: true };
}
