import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Slide } from "@/components/PhotoGrid";
import ProjectStory from "@/components/ProjectStory";
import { getNeighbours, getProject, getProjects } from "@/lib/projects";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  const description =
    project.paragraphs[0] ??
    [project.title, project.where, project.when].filter(Boolean).join(", ");

  return {
    title: project.title,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      title: project.title,
      description,
      images: project.cover ? [{ url: project.cover.src }] : undefined,
    },
  };
}

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const { previous, next } = getNeighbours(project.slug);

  const slides: Slide[] = project.photos.map((item) => ({
    key: item.file,
    photo: item.photo,
    caption: [item.credit, item.year].filter(Boolean).join(", "),
  }));

  return (
    <main className="page">
      <header className="project-header">
        <p className="crumb">
          <Link href="/projects">projects</Link>
        </p>
        <h1 className="page-title">{project.title}</h1>
        <p className="project-meta">
          {[project.where, project.when, credit(project.credits)].filter(Boolean).join(" · ")}
        </p>
      </header>

      <ProjectStory slides={slides} paragraphs={project.paragraphs} />

      {previous && next ? (
        <nav className="project-nav" aria-label="Other projects">
          <Link href={`/projects/${previous.slug}`}>← {previous.title}</Link>
          <Link href="/projects">all projects</Link>
          <Link href={`/projects/${next.slug}`}>{next.title} →</Link>
        </nav>
      ) : null}
    </main>
  );
}

function credit(credits: string[]) {
  if (credits.length === 0) return null;
  if (credits.length === 1) return `photos by ${credits[0]}`;
  return `photos by ${credits.slice(0, -1).join(", ")} and ${credits[credits.length - 1]}`;
}
