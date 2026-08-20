import { mediaUrl } from "@/lib/supabase/config";
import type { PageSettings } from "@/lib/admin/page-settings";

/**
 * A picture behind the words of a page.
 *
 * Fixed rather than scrolling, and behind everything: the page's own content
 * sits above it in the stacking order, so the words stay the thing you read.
 *
 * `mix-blend-mode` is the reason this is a picture rather than a CSS background
 * image — blending needs the paper underneath, and it is what makes a photograph
 * belong to this site rather than sit on top of it. Multiply drops the white out
 * of a scan onto the paper, which is the same trick the logo in the menu uses.
 *
 * Every dial comes from /admin. See BACKGROUND in lib/admin/page-settings for
 * why these particular ones and not others.
 */
export default function PageBackground({ settings }: { settings: PageSettings }) {
  const path = String(settings.background ?? "");
  if (!path) return null;

  const fit = String(settings.backgroundFit ?? "cover");
  const rotate = Number(settings.backgroundRotate ?? 0);

  return (
    <div
      className="page-bg"
      data-fit={fit}
      aria-hidden="true"
      style={
        {
          "--bg-opacity": Number(settings.backgroundOpacity ?? 18) / 100,
          "--bg-blend": String(settings.backgroundBlend ?? "multiply"),
          "--bg-rotate": `${rotate}deg`,
          "--bg-width": `${Number(settings.backgroundWidth ?? 100)}%`,
        } as React.CSSProperties
      }
    >
      {/* Not next/image: it is one decorative picture per page, already sized by
          whoever chose it, and the sizes it would be asked for depend on dials
          that change without the file changing. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mediaUrl(path)} alt="" />
    </div>
  );
}
