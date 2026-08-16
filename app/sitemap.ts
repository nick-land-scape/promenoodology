import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getStories } from "@/lib/source";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = [
    "/",
    "/stories",
    "/resources",
    "/community",
    "/about",
    "/newsletter",
    "/handbook",
  ];
  const stories = (await getStories()).map((story) => `/stories/${story.slug}`);

  return [...pages, ...stories].map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: "monthly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
