"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

/**
 * Leaving, asked twice.
 *
 * Small, quiet and last, because it is not a thing anybody should reach for by
 * accident — and asked twice, because it cannot be undone. The first press only
 * says what will happen; the second one does it.
 *
 * The deleting is done by Supabase's own function rather than by this site's
 * server (see supabase/functions/leave-the-club). Removing a login needs a key
 * that would otherwise have to be set by hand on the hosting account — and an
 * account deletion that half works because a variable is missing is worse than
 * none: it takes the person's things and leaves them a login.
 */
export default function Leaving() {
  const router = useRouter();
  const [sure, setSure] = useState(false);
  const [trouble, setTrouble] = useState("");
  const [pending, start] = useTransition();

  if (!sure) {
    return (
      <button type="button" className="leaving" onClick={() => setSure(true)}>
        leave the club
      </button>
    );
  }

  return (
    <div className="leaving-sure">
      <p>
        Everything goes: your name, your portrait, your member number, what you signed up for, and
        everything you have written here — with the pictures on it. Your way in is deleted too. None
        of it can be brought back.
      </p>

      <button
        type="button"
        className="leaving leaving-do"
        disabled={pending}
        onClick={() => {
          // Twice, and the second one is the machine's own dialogue: a press that
          // deletes everything should have to get past something that is not
          // ours to style.
          if (!confirm("Delete your account and everything on it? This cannot be undone.")) return;
          setTrouble("");
          start(async () => {
            const supabase = supabaseBrowser();
            const { data, error } = await supabase.functions.invoke("leave-the-club", {
              method: "POST",
            });
            const said = data as { ok?: boolean; error?: string } | null;

            if (error || !said?.ok) {
              setTrouble(
                said?.error ??
                  "That did not finish. Nothing has been deleted — write to info@promeNOODology.com and we will do it by hand.",
              );
              return;
            }

            // The login is gone, so the session in this browser is a ghost.
            await supabase.auth.signOut();
            router.replace("/app/enter");
            router.refresh();
          });
        }}
      >
        {pending ? "deleting everything…" : "yes, delete everything"}
      </button>

      <button type="button" className="leaving leaving-stay" onClick={() => setSure(false)}>
        no, stay
      </button>

      {trouble ? <p className="app-error">{trouble}</p> : null}
    </div>
  );
}
