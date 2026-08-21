import BinLink from "@/components/admin/BinLink";
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
      .select("id, name, country, photo_path")
      .order("name")
      .returns<{ id: string; name: string; country: string | null; photo_path: string | null }[]>(),
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
    country: one.country ?? "",
    // The portrait, so a name in a list of sixty-six is a face you recognise
    // rather than a string you hope is the right one.
    photo: one.photo_path ? mediaUrl(one.photo_path) : null,
  }));

  return (
    <Head title="the archive" action={<BinLink table="photos" />}>
      {/* Was four lines explaining the wall, the credits and the cropping.
          Everything it said is now visible on the cards themselves. */}
      <p className="admin-intro">
        Who took each one, which year, and which story it belongs to. Pick the photographer from the
        community where you can — their name then follows them if they change it.
      </p>
      <PhotoLibrary initial={items} stories={options} people={persons} filter={story ?? ""} />
    </Head>
  );
}
