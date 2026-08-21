import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { BINNABLE, DAYS_IN_THE_BIN } from "@/lib/admin/bin";

/**
 * Emptying the bin, nightly.
 *
 * The bin has a button that does this on demand, and a bin that only empties
 * while somebody is looking at it is not a thirty-day policy — it is a
 * thirty-day suggestion. This is the part that makes the promise true.
 *
 * It runs as the service role, because there is no admin signed in at four in
 * the morning. That key is the one thing here that can do real damage, so:
 *
 *  - the route refuses without it, and says so, rather than reporting success
 *    for having deleted nothing;
 *  - it refuses without the secret, so the URL alone is not the authorisation;
 *  - and it only ever touches rows whose deleted_at is older than thirty days,
 *    which is a condition no caller can widen.
 *
 * Vercel sends its own Authorization header for a cron; a person testing it can
 * send the same secret by hand.
 */

export const dynamic = "force-dynamic";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const secret = process.env.CRON_SECRET ?? "";

export async function GET(request: NextRequest) {
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "There is no CRON_SECRET set, so this cannot tell a cron from a stranger." },
      { status: 500 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Not for you." }, { status: 401 });
  }
  if (!url || !service) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "No service-role key, so nothing can be emptied. Set SUPABASE_SERVICE_ROLE_KEY on Vercel — until then the bin only empties when somebody presses the button in it.",
      },
      { status: 500 },
    );
  }

  const supabase = createClient(url, service, { auth: { persistSession: false } });
  const due = new Date(Date.now() - DAYS_IN_THE_BIN * 24 * 60 * 60 * 1000).toISOString();

  const swept: Record<string, number> = {};
  const trouble: string[] = [];

  for (const spec of BINNABLE) {
    const { data, error } = await supabase
      .from(spec.table)
      // The columns are named at run time, so the builder's own parser cannot
      // see a shape in the string. Said out loud rather than fought with.
      .select(spec.file ? `id, ${spec.file}` : "id")
      .not("deleted_at", "is", null)
      .lt("deleted_at", due)
      .returns<Record<string, string | null>[]>();

    if (error) {
      trouble.push(`${spec.table}: ${error.message}`);
      continue;
    }

    let gone = 0;
    for (const row of data ?? []) {
      // The file first: nothing points at this row any more, so the only
      // mistake left is deleting the row and paying for the file for ever.
      const path = spec.file ? row[spec.file] : null;
      if (path) {
        const { error: left } = await supabase.storage.from("media").remove([path]);
        if (left) trouble.push(`${spec.table} ${row.id}: the file stayed — ${left.message}`);
      }

      const { error: kept } = await supabase
        .from(spec.table)
        .delete()
        .eq("id", row.id as string);
      if (kept) {
        trouble.push(`${spec.table} ${row.id}: ${kept.message}`);
        continue;
      }
      gone += 1;
    }
    if (gone > 0) swept[spec.table] = gone;
  }

  return NextResponse.json({
    ok: trouble.length === 0,
    emptied: swept,
    total: Object.values(swept).reduce((sum, n) => sum + n, 0),
    ...(trouble.length > 0 ? { trouble } : {}),
  });
}
