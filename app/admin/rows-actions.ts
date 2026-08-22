"use server";

import { requireAdminAction } from "@/lib/admin/guard";
import { failed, refreshSite, type Saved } from "@/lib/admin/revalidate";
import { kindOf, TABLES, type TableName, writableColumns } from "@/lib/admin/tables";
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

export type RowValues = Record<string, string | number | boolean | null | string[]>;

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
    const kind = kindOf(table, key);
    const column = { kind } as { kind: ReturnType<typeof kindOf> };

    if (kind === "boolean") {
      out[key] = value === true;
      continue;
    }
    // A date input hands back "" when it is cleared, which is not a date.
    if (column?.kind === "date" || column?.kind === "dates") {
      out[key] = typeof value === "string" && value ? value : null;
      continue;
    }
    if (column?.kind === "number") {
      /* "How many ate" is filled in after the evening, so empty has to mean
         "nobody has counted" rather than nought — a wall of zeroes would be a
         claim, and the wrong one. Everything else counted here is a real zero:
         no places means as many as turn up. */
      if (value === "" || value === null || value === undefined) {
        out[key] = key === "people_fed" ? null : 0;
        continue;
      }
      out[key] = Number(value) || 0;
      continue;
    }
    /* Two numbers that are only ever a pair. Degrees, and inside the range the
       planet has: anything else is a typo, and a pin at 900° is a pin nowhere. */
    if (column?.kind === "where") {
      const at = Number(value);
      const limit = key.endsWith("lat") || key === "lat" ? 90 : 180;
      out[key] = value === "" || value === null || !Number.isFinite(at) || Math.abs(at) > limit
        ? null
        : at;
      continue;
    }
    /* A list of people: only what is actually a list of ids, and nothing that
       is not — this is a public endpoint, and an array is the one shape here
       that can carry more than one bad value at a time. */
    if (column?.kind === "people" || column?.kind === "partners") {
      const ids = Array.isArray(value) ? value : [];
      out[key] = ids
        .filter((one): one is string => typeof one === "string")
        .filter((one) => /^[0-9a-f-]{36}$/i.test(one))
        .slice(0, 20);
      continue;
    }
    // A story or a picture is either chosen or it is nothing.
    if (column?.kind === "story" || column?.kind === "photo" || column?.kind === "storyref") {
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

  /*
   * At most one row pinned, held here rather than by a unique index.
   *
   * An index would refuse the moment two rows were true, and that moment has to
   * exist when rows are written one at a time. Clearing every other row first, in
   * this same call, means there is never a second one to refuse — and if the
   * clear fails, nothing after it runs.
   */
  const pin = TABLES[name].pinned;
  if (pin) {
    const beingPinned = rows.find((row) => row[pin] === true);
    if (beingPinned) {
      // Said out loud, because the column name is only known at run time and
      // the generated types cannot see that it is a boolean.
      const clearing: Record<string, boolean> = { [pin]: false };
      const { error } = await supabase
        .from(name)
        .update(clearing as never)
        .neq("id", beingPinned.id);
      if (error) return failed(error);
    }
  }

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

  /* Into the bin, not gone: these four sections are quotes, notes, gifts and
     evenings, and the one people delete by accident is whichever they are
     looking at. bin-actions does the destroying, thirty days later. */
  const { error } = await supabase
    .from(name)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return failed(error);

  refreshSite();
  return { ok: true };
}
