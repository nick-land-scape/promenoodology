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
    .eq("slug", slug)
    .maybeSingle<StoryRow & { topics: string[] | null }>();
  if (!story) notFound();

  // Its photographs, in the order they will be read in — so the editor is where
  // the page gets arranged rather than only where its words get typed.
  const [{ data: photos }, { data: theirs }, { data: made }, { data: people }, { data: partners }] =
    await Promise.all([
      supabase
        .from("photos")
        .select("id, path, credit, credit_profile_id, year, published, layout, width, height")
        .eq("story_tag", story.tag)
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
          people: (theirs ?? []).map((one) => one.profile_id),
          partners: (made ?? []).map((one) => one.association_id),
        }}
        photos={(photos ?? []).map((photo) => ({
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
      />
    </Head>
  );
}
