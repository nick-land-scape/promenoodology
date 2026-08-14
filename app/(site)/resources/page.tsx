import type { Metadata } from "next";
import ResourceGallery, { type EventFilter } from "@/components/ResourceGallery";
import ResourceKinds from "@/components/ResourceKinds";
import { getFilters, getResources } from "@/lib/data";
import { getStories } from "@/lib/stories";

export const metadata: Metadata = {
  title: "Photos",
  description: "Every photo we have, filtered by story and by year.",
  alternates: { canonical: "/resources" },
};

export default function ResourcesPage() {
  const resources = getResources();
  const { years } = getFilters(resources);
  const stories = getStories();

  // Only offer a filter for stories that actually have photos.
  const events: EventFilter[] = stories
    .filter((story) => story.photos.length > 0)
    .map((story) => ({ tag: story.tag, title: story.title, slug: story.slug }));

  return (
    <main className="page">
      <h1 className="visually-hidden">Photos</h1>
      <ResourceGallery
        resources={resources}
        events={events}
        years={years}
        kinds={<ResourceKinds current="/resources" />}
      />
    </main>
  );
}
