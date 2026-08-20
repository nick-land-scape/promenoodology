import Head from "@/components/admin/Head";
import { requireAdmin } from "@/lib/admin/guard";
import { mediaUrl } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";
import PhotoLibrary, { type PhotoItem, type StoryOption } from "./PhotoLibrary";

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ story?: string }>;
}) {
  await requireAdmin();
  const { story } = await searchParams;
  const supabase = await supabaseServer();

  const [{ data: photos }, { data: stories }] = await Promise.all([
    supabase
      .from("photos")
      .select("id, path, width, height, credit, year, story_tag, published")
      .order("position")
      .returns<
        {
          id: string;
          path: string;
          width: number;
          height: number;
          credit: string;
          year: string;
          story_tag: string | null;
          published: boolean;
        }[]
      >(),
    supabase
      .from("stories")
      .select("tag, title")
      .order("position")
      .returns<{ tag: string; title: string }[]>(),
  ]);

  const items: PhotoItem[] = (photos ?? []).map((photo) => ({
    id: photo.id,
    path: photo.path,
    url: mediaUrl(photo.path),
    width: photo.width,
    height: photo.height,
    credit: photo.credit ?? "",
    year: photo.year ?? "",
    story: photo.story_tag,
    published: photo.published,
  }));

  const options: StoryOption[] = (stories ?? []).map((one) => ({
    tag: one.tag,
    title: one.title,
  }));

  return (
    <Head title="the archive" view="/resources">
      <p className="admin-intro">
        Photographs keep the shape they arrived in — the wall is not a grid — so there is nothing to
        crop and nothing to line up. What matters is who took each one, the year, and which story it
        belongs to.
      </p>
      <PhotoLibrary initial={items} stories={options} filter={story ?? ""} />
    </Head>
  );
}
