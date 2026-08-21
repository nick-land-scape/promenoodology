import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Leaving the club, for good. Deployed to Supabase; kept here so what is running
 * can be read in the repository.
 *
 * Everything: the profile, the portrait, what you signed up for, everything you
 * wrote and every picture on it, and the login itself. Not a flag, not a note to
 * somebody's inbox — the rows are deleted.
 *
 * Why it lives here rather than in the site's own server: deleting a login needs
 * the service key, and the site's copy of that key is a variable somebody has to
 * set on the hosting account. Until it is set, the app would delete a person's
 * data and leave their login behind — which is not what the button says, and not
 * what Google's rules allow of an app that keeps accounts. In here the key is
 * Supabase's own, injected by Supabase, and there is nothing to configure.
 *
 * It only ever deletes the caller. The platform verifies the JWT before this runs
 * and the id comes from the token rather than the body — there is no way to ask it
 * to delete somebody else, because there is nowhere to say who.
 */

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const answer = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return answer({ ok: false, error: "POST only." }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const token = request.headers.get("Authorization")?.replace(/^Bearer /i, "") ?? "";
  if (!token) return answer({ ok: false, error: "Not signed in." }, 401);

  const admin = createClient(url, service, { auth: { persistSession: false } });

  // Who is asking. From the token, never from the body.
  const { data: who, error: unknownUser } = await admin.auth.getUser(token);
  const user = who?.user;
  if (unknownUser || !user) return answer({ ok: false, error: "Not signed in." }, 401);

  const { data: profile } = await admin
    .from("profiles")
    .select("id, photo_path")
    .eq("user_id", user.id)
    .maybeSingle();

  const files: string[] = [];

  if (profile) {
    /* Their own two folders in the bucket — the portrait, and anything they put
       on a post — listed rather than guessed at. */
    for (const folder of [`profiles/${user.id}`, `posts/${user.id}`]) {
      const { data: inThere } = await admin.storage.from("media").list(folder);
      for (const file of inThere ?? []) files.push(`${folder}/${file.name}`);
    }

    // Anything pointed at by a row rather than sitting in their folder.
    const { data: posts } = await admin
      .from("posts")
      .select("photo_paths, photo_path")
      .eq("author_id", profile.id);
    for (const post of posts ?? []) {
      for (const path of [...(post.photo_paths ?? []), post.photo_path]) {
        if (path) files.push(path);
      }
    }
    if (profile.photo_path) files.push(profile.photo_path);

    if (files.length > 0) await admin.storage.from("media").remove(files);

    /* The profile takes the posts, the replies, the waves and the bookings with
       it: they all point at it with "on delete cascade". */
    const { error: stayed } = await admin.from("profiles").delete().eq("id", profile.id);
    if (stayed) return answer({ ok: false, error: stayed.message }, 500);
  }

  // And the login, last, so nothing is left half done behind a working sign-in.
  const { error: stillThere } = await admin.auth.admin.deleteUser(user.id);
  if (stillThere) return answer({ ok: false, error: stillThere.message }, 500);

  return answer({ ok: true, files: files.length });
});
