import type { Metadata } from "next";
import ResourceGallery, { type EventFilter } from "@/components/ResourceGallery";
import { getFilters, getResources } from "@/lib/data";
import { getProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Resources",
  description: "Every photo we have, filtered by project and by year.",
  alternates: { canonical: "/resources" },
};

export default function ResourcesPage() {
  const resources = getResources();
  const { years } = getFilters(resources);
  const projects = getProjects();

  // Only offer a filter for projects that actually have photos.
  const events: EventFilter[] = projects
    .filter((project) => project.photos.length > 0)
    .map((project) => ({ tag: project.tag, title: project.title, slug: project.slug }));

  return (
    <main className="page">
      <h1 className="visually-hidden">Resources</h1>
      <ResourceGallery resources={resources} events={events} years={years} />
    </main>
  );
}
