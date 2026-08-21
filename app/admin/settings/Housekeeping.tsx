"use client";

import { useRouter } from "next/navigation";
import ArchiveCheck from "@/components/admin/ArchiveCheck";
import { deletePhoto, fixSizes } from "@/app/admin/photos/actions";

/**
 * The one maintenance job worth having a button for.
 *
 * It lived at the top of the archive for a day and did not deserve to stay
 * there: it is worth running after an import and never otherwise, and a
 * diagnostic panel above the work is a diagnostic panel you stop reading.
 */
export default function Housekeeping({
  photos,
}: {
  photos: { id: string; path: string; url: string; width: number; height: number }[];
}) {
  const router = useRouter();

  return (
    <ArchiveCheck
      items={photos}
      onFix={async (fixes) => {
        const result = await fixSizes(fixes);
        if (!result.ok) return result.error ?? "The sizes did not save.";
        router.refresh();
        return null;
      }}
      onDrop={async (ids) => {
        for (const id of ids) {
          const result = await deletePhoto(id);
          if (!result.ok) return result.error ?? "One of them would not delete.";
        }
        router.refresh();
        return null;
      }}
    />
  );
}
