import Head from "@/components/admin/Head";
import { requireAdmin } from "@/lib/admin/guard";
import { mediaUrl } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";
import PhotoLibrary, {
  type PersonOption,
  type PhotoItem,
  type StoryOption,
} from "./PhotoLibrary";

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ story?: string }>;
}) {
  await requireAdmin();
  const { story } = await searchParams;
  const supabase = await supabaseServer();

  const [{ data: photos }, { data: stories }, { data: people }] = await Promise.all([
    supabase
      .from("photos")
      .select("id, path, width, height, credit, credit_profile_id, year, story_tag, published")
      .order("position")
      .returns<
        {
          id: string;
          path: string;
          width: number;
          height: number;
          credit: string;
          credit_profile_id: string | null;
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
    // Everybody who could have taken one, whether or not they are shown on the
    // community page — somebody hidden there still took photographs.
    supabase
      .from("profiles")
      .select("id, name")
      .order("name")
      .returns<{ id: string; name: string }[]>(),
  ]);

  const items: PhotoItem[] = (photos ?? []).map((photo) => ({
    id: photo.id,
    path: photo.path,
    url: mediaUrl(photo.path),
    width: photo.width,
    height: photo.height,
    credit: photo.credit ?? "",
    person: photo.credit_profile_id,
    year: photo.year ?? "",
    story: photo.story_tag,
    published: photo.published,
  }));

  const options: StoryOption[] = (stories ?? []).map((one) => ({
    tag: one.tag,
    title: one.title,
  }));

  const persons: PersonOption[] = (people ?? []).map((one) => ({
    id: one.id,
    name: one.name,
  }));

  return (
    <Head title="the archive" view="/archive">
      <p className="admin-intro">
        Photographs keep the shape they arrived in — the wall is not a grid — so there is nothing to
        crop and nothing to line up. What matters is who took each one, the year, and which story it
        belongs to. Pick the photographer from the community where you can — then their name follows
        them if they ever change it.
      </p>
      <PhotoLibrary initial={items} stories={options} people={persons} filter={story ?? ""} />
    </Head>
  );
}
