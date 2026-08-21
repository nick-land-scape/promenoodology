"use server";

import { requireAdminAction } from "@/lib/admin/guard";
import { failed, refreshSite, type Saved } from "@/lib/admin/revalidate";
import { supabaseServer } from "@/lib/supabase/server";
import type { Theme } from "@/lib/theme";

/**
 * The look of the whole site, which is one row and one update.
 *
 * Colours are checked rather than trusted: what goes in here is printed straight
 * into a <style> on every page, so a value that is not a colour is a value that
 * either does nothing or does something nobody asked for. A field that fails the
 * check is stored empty, which means "as drawn" — the site's own value, not a
 * broken one.
 *
 * Typefaces are checked more loosely, because a font stack is a list of names
 * and quotes and there is no short way to be sure of one. Braces and semicolons
 * are what would let a value out of the declaration it belongs to, so those are
 * what is refused.
 */

const A_COLOUR = /^#[0-9a-f]{3}$|^#[0-9a-f]{6}$|^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i;

const colour = (value: string) => {
  const said = value.trim();
  return A_COLOUR.test(said) ? said : "";
};

const stack = (value: string) => {
  const said = value.trim();
  if (!said || said.length > 200) return "";
  return /[{};<>]/.test(said) ? "" : said;
};

export async function saveTheme(theme: Theme): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("theme")
    .update({
      serif: stack(theme.serif),
      sans: stack(theme.sans),
      ink: colour(theme.ink),
      paper: colour(theme.paper),
      purple: colour(theme.purple),
      blue: colour(theme.blue),
      pink: colour(theme.pink),
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) {
    // The one that will actually happen: the migration has not been run yet.
    if (/relation .*theme.* does not exist|could not find the table/i.test(error.message)) {
      return {
        ok: false,
        error:
          "There is no theme table yet. Run supabase/migrations/0009_theme.sql and this page starts working.",
      };
    }
    return failed(error);
  }

  refreshSite();
  return { ok: true };
}
