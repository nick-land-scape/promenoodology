import type { MetadataRoute } from "next";
import { getProjects } from "@/lib/projects";

const SITE = "https://promenoodology.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/projects", "/resources", "/community", "/about"];
  const projects = getProjects().map((project) => `/projects/${project.slug}`);

  return [...pages, ...projects].map((route) => ({
    url: `${SITE}${route}`,
    changeFrequency: "monthly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
