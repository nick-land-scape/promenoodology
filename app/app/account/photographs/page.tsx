import AppHeader from "@/components/app/AppHeader";
import Photo from "@/components/Photo";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";
import { myPhotos, readingIn, requireMember } from "@/lib/app/me";

export const metadata = { title: "Your photographs" };
export const dynamic = "force-dynamic";

export default async function MyPhotographsPage() {
  const say = speaking(await readingIn(), await getFrench());
  await requireMember("/app/account/photographs");
  const photos = await myPhotos();

  return (
    <>
      <AppHeader
        eyebrow={say("mine.photographs")}
        title={say("pg.whatYouTook")}
        back="/app/account"
      />
      {photos.length === 0 ? (
        <p className="app-note" style={{ padding: "18px var(--gutter)" }}>
          {say("mine.noPhotographs")}
        </p>
      ) : (
        <ul className="mine-grid mine-grid-all">
          {photos.map((photo) => (
            <li key={photo.id}>
              <Photo src={photo.src} alt="" width={photo.width} height={photo.height} sizes="33vw" />
              {photo.year ? <span>{photo.year}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
