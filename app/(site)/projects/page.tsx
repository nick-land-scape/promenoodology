import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "The things we have put on together — one page each.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  const projects = getProjects();

  return (
    <main className="page">
      <h1 className="page-title">projects</h1>

      <ul className="project-list">
        {projects.map((project) => (
          <li key={project.slug} className="project-card">
            <Link href={`/projects/${project.slug}`}>
              <span className="project-cover">
                {project.cover ? (
                  <Image
                    src={project.cover.src}
                    alt=""
                    fill
                    sizes="(max-width: 767px) 45vw, 320px"
                  />
                ) : null}
              </span>
              <span className="project-name">{project.title}</span>
              <span className="project-meta">
                {[project.where, project.when, count(project.photos.length)]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

function count(total: number) {
  if (total === 0) return null;
  return `${total} photo${total === 1 ? "" : "s"}`;
}
