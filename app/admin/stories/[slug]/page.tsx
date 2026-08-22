import { notFound } from "next/navigation";
import Head from "@/components/admin/Head";
import { requireAdmin } from "@/lib/admin/guard";
import { mediaUrl } from "@/lib/supabase/config";
import type { PhotoLayout } from "@/lib/supabase/rows";
import { supabaseServer } from "@/lib/supabase/server";
import type { StoryRow } from "@/lib/supabase/rows";
import StoryEditor from "./StoryEditor";

export default async function EditStoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const supabase = await supabaseServer();

  const { data: story } = await supabase
    .from("stories")
    .select("*")
    .is("deleted_at", null)
    .eq("slug", slug)
    .maybeSingle<StoryRow & { topics: string[] | null; fr: Record<string, string> | null }>();
  if (!story) notFound();

  // Its photographs, in the order they will be read in — so the editor is where
  // the page gets arranged rather than only where its words get typed.
  const [
    { data: photos },
    { data: built },
    { data: theirs },
    { data: made },
    { data: people },
    { data: partners },
  ] = await Promise.all([
      // The whole archive, once: this story's own photographs come out of it
      // below, and so does the list the "add photographs" dialog offers.
      supabase
        .from("photos")
        .select("id, path, credit, credit_profile_id, year, published, layout, width, height, story_tag")
    .is("deleted_at", null)
        .order("position")
        .returns<
          {
            id: string;
            path: string;
            credit: string;
            credit_profile_id: string | null;
            year: string;
            published: boolean;
            layout: string | null;
            width: number;
            height: number;
            story_tag: string | null;
          }[]
        >(),
      supabase
        .from("story_blocks")
        .select("id, position, kind, words, photo_id, layout, fr")
        .eq("story_id", story.id)
        .order("position")
        .returns<
          {
            id: string;
            position: number;
            kind: "heading" | "text" | "photo" | "space";
            words: string;
            photo_id: string | null;
            layout: string | null;
            fr: Record<string, string> | null;
          }[]
        >(),
      supabase
        .from("story_people")
        .select("profile_id")
        .eq("story_id", story.id)
        .order("position")
        .returns<{ profile_id: string }[]>(),
      supabase
        .from("story_partners")
        .select("association_id")
        .eq("story_id", story.id)
        .order("position")
        .returns<{ association_id: string }[]>(),
      // Everybody who could have been there, and every partner there is.
      supabase
        .from("profiles")
        .select("id, name, country, photo_path")
        .order("name")
        .returns<{ id: string; name: string; country: string | null; photo_path: string | null }[]>(),
      supabase
        .from("associations")
        .select("id, name, logo_path")
    .is("deleted_at", null)
        .order("position")
        .returns<{ id: string; name: string; logo_path: string | null }[]>(),
    ]);

  // Who took each one: the name on their profile where there is one, so a
  // correction to a name reaches every photograph they took.
  const named = new Map((people ?? []).map((one) => [one.id, one.name]));

  return (
    <Head
      title={story.title || "Untitled"}
      back={{ href: "/admin/stories", label: "stories" }}
    >
      <StoryEditor
        story={{
          id: story.id,
          slug: story.slug,
          title: story.title,
          tag: story.tag,
          place: story.place ?? "",
          lat: story.lat ?? null,
          lng: story.lng ?? null,
          people_fed: story.people_fed ?? null,
          happened: story.happened ?? "",
          made_with: story.made_with ?? "",
          subtitle: story.subtitle ?? "",
          sections: (story.sections ?? []).map((section) => ({
            heading: section.heading ?? "",
            texts: section.texts?.length ? section.texts : [""],
          })),
          published: story.published,
          featured: story.featured_photo_id ?? null,
          topics: story.topics ?? [],
          fr: story.fr ?? {},
          people: (theirs ?? []).map((one) => one.profile_id),
          partners: (made ?? []).map((one) => one.association_id),
          /* The page as it stands. A story with none has never been arranged by
             hand and is still drawn by the old rule — see StoryBody — so this
             opens empty rather than pretending to be the page. */
          page: (built ?? []).map((block) => ({
            id: block.id,
            kind: block.kind,
            words: block.words ?? "",
            photoId: block.photo_id,
            layout: (block.layout ?? null) as PhotoLayout | null,
            fr: block.fr ?? {},
          })),
        }}
        photos={(photos ?? []).filter((photo) => photo.story_tag === story.tag).map((photo) => ({
          id: photo.id,
          url: mediaUrl(photo.path),
          credit:
            (photo.credit_profile_id ? named.get(photo.credit_profile_id) : "") ||
            photo.credit ||
            "",
          year: photo.year,
          published: photo.published,
          layout: (photo.layout ?? null) as PhotoLayout | null,
          width: photo.width,
          height: photo.height,
        }))}
        everybody={(people ?? []).map((one) => ({
          value: one.id,
          label: one.name,
          note: one.country || undefined,
          image: one.photo_path ? mediaUrl(one.photo_path) : undefined,
        }))}
        organisations={(partners ?? []).map((one) => ({
          value: one.id,
          label: one.name || "unnamed partner",
          image: one.logo_path ? mediaUrl(one.logo_path) : undefined,
        }))}
        archive={(photos ?? []).map((photo) => ({
          value: photo.id,
          label:
            [
              (photo.credit_profile_id ? named.get(photo.credit_profile_id) : "") || photo.credit,
              photo.year,
            ]
              .filter(Boolean)
              .join(", ") || "no credit",
          image: mediaUrl(photo.path),
          width: photo.width,
          height: photo.height,
          inStory: photo.story_tag === story.tag,
        }))}
        years={[...new Set((photos ?? []).map((photo) => photo.year).filter(Boolean))]
          .sort()
          .reverse()
          .map((year) => ({ value: year, label: year }))}
      />
    </Head>
  );
}
