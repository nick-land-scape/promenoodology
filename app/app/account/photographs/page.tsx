import AppHeader from "@/components/app/AppHeader";
import Photo from "@/components/Photo";
import { myPhotos, requireMember } from "@/lib/app/me";

export const metadata = { title: "Your photographs" };
export const dynamic = "force-dynamic";

export default async function MyPhotographsPage() {
  await requireMember("/app/account/photographs");
  const photos = await myPhotos();

  return (
    <>
      <AppHeader eyebrow="your photographs" title="what you took" back="/app/account" />
      {photos.length === 0 ? (
        <p className="app-note" style={{ padding: "18px var(--gutter)" }}>
          None yet. The archive says who took what, and anything credited to you turns up here.
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
