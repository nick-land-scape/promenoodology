"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/** One client per browser tab, shared by everything on the page. */
let client: ReturnType<typeof createBrowserClient> | null = null;

export function supabaseBrowser() {
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}
