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
    .maybeSingle<StoryRow>();
  if (!story) notFound();

  // Its photographs, in the order they will be read in — so the editor is where
  // the page gets arranged rather than only where its words get typed.
  const { data: photos } = await supabase
    .from("photos")
    .select("id, path, credit, year, published, layout")
    .eq("story_tag", story.tag)
    .order("position")
    .returns<
      {
        id: string;
        path: string;
        credit: string;
        year: string;
        published: boolean;
        layout: string | null;
      }[]
    >();

  return (
    <Head
      title={story.title || "Untitled"}
      back={{ href: "/admin/stories", label: "stories" }}
      view={story.published ? `/stories/${story.slug}` : undefined}
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
        }}
        photos={(photos ?? []).map((photo) => ({
          id: photo.id,
          url: mediaUrl(photo.path),
          credit: photo.credit,
          year: photo.year,
          published: photo.published,
          layout: (photo.layout ?? null) as PhotoLayout | null,
        }))}
      />
    </Head>
  );
}
