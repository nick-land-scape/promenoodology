import Head from "@/components/admin/Head";
import { requireAdmin } from "@/lib/admin/guard";
import { getFrench } from "@/lib/source";
import { PHRASES } from "@/lib/words";
import Phrasebook from "./Phrasebook";

/* Blocking, because this page is about whoever is asking: it reads the session
   before it can draw anything, and there is no version of it to prerender for
   everybody. `instant = false` is what `force-dynamic` was called before
   cacheComponents. */
export const instant = false;

export const metadata = { title: "Translation" };

/**
 * The words the site says on its own behalf, in French.
 *
 * Not the content — an evening's name, a story, the handbook — which is
 * translated where it is written, beside the English, because the person
 * writing it is the person who knows what it means. These are the labels and
 * the buttons: "still wanted", "and what has been", "take it as a PDF". They
 * live in the code, and this is the one place they can be argued with without
 * one.
 */
export default async function TranslationPage() {
  await requireAdmin();
  const said = await getFrench();

  return (
    <Head title="translation" back={{ href: "/admin/settings", label: "settings" }}>
      <p className="admin-intro">
        The words the site says itself — the headings, the buttons, the labels. Everything anybody
        <em> wrote</em> is translated where it was written: an evening under What&rsquo;s on, a
        story under Stories, the pages under Pages. This is the rest.
      </p>
      <p className="admin-note">
        Leaving a field empty is not leaving it in English: it falls back to the French the site was
        written with, which is what the grey text shows. Change one only where you would say it
        differently.
      </p>

      <Phrasebook phrases={PHRASES} initial={said} />
    </Head>
  );
}
