import type { MetadataRoute } from "next";
import { getStories } from "@/lib/stories";

const SITE = "https://promenoodology.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    "/",
    "/stories",
    "/resources",
    "/resources/quotes",
    "/community",
    "/about",
    "/join",
    "/handbook",
    "/donations",
  ];
  const stories = getStories().map((story) => `/stories/${story.slug}`);

  return [...pages, ...stories].map((route) => ({
    url: `${SITE}${route}`,
    changeFrequency: "monthly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
