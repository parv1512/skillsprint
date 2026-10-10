"use client";

import Link from "next/link";
import { useProjects } from "./project-provider";
import { Icon } from "./icon";

export function ProjectList() {
  const { projects, ready, error } = useProjects();
  return <><div className="page-heading"><div><h1>My projects</h1></div><Link href="/projects/new" className="button button-primary">New project<Icon name="plus" /></Link></div>{error && <p role="alert" className="notice notice-error">{error}</p>}{!ready ? <p role="status">Opening your projects…</p> : projects.length ? <div className="project-list">{projects.map((project, index) => <article className="project-row" key={project.id}><span className="section-number">{String(index + 1).padStart(2, "0")}</span><div><h2><Link href={`/projects/${project.id}`}>{project.roadmap.title}</Link></h2><div className="project-meta"><span>{project.roadmap.milestones.length} milestones</span><span>{project.completedMilestoneIds.length} completed</span></div></div><Link href={`/projects/${project.id}`} className="text-link" aria-label={`Open roadmap for ${project.roadmap.title}`}>Open roadmap<Icon name="arrow" /></Link></article>)}</div> : <div className="studio-empty project-list-empty"><h2>No projects yet</h2><p>Create a roadmap for your first idea.</p><Link href="/projects/new" className="button button-primary">New project<Icon name="arrow" /></Link></div>}</>;
}
