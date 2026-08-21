import Head from "@/components/admin/Head";
import { Icon } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/guard";
import { supabaseServer } from "@/lib/supabase/server";
import { createStory } from "./actions";
import StoriesList, { type StoryRow } from "./StoriesList";

export default async function StoriesPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const [{ data: stories }, { data: photos }] = await Promise.all([
    supabase
      .from("stories")
      .select("id, slug, title, tag, position, place, happened, published")
      .order("position")
      .returns<
        {
          id: string;
          slug: string;
          title: string;
          tag: string;
          position: number;
          place: string | null;
          happened: string | null;
          published: boolean;
        }[]
      >(),
    supabase.from("photos").select("story_tag").returns<{ story_tag: string | null }[]>(),
  ]);

  // How many photographs each story has, so an empty one is obvious from here.
  const tally = new Map<string, number>();
  for (const photo of photos ?? []) {
    if (photo.story_tag) tally.set(photo.story_tag, (tally.get(photo.story_tag) ?? 0) + 1);
  }

  const rows: StoryRow[] = (stories ?? []).map((story) => ({
    id: story.id,
    slug: story.slug,
    title: story.title,
    tag: story.tag,
    place: story.place ?? "",
    happened: story.happened ?? "",
    published: story.published,
    photos: tally.get(story.tag) ?? 0,
  }));

  return (
    <Head
      title="stories"
      action={
        <form action={createStory}>
          <button type="submit" className="admin-btn">
            <Icon name="plus" />
            new story
          </button>
        </form>
      }
    >
      <p className="admin-intro">
        One story each, in the order they are read in. The order is also the one the arrows at the
        bottom of a story follow, so it is worth thinking about.
      </p>
      <StoriesList initial={rows} />
    </Head>
  );
}
