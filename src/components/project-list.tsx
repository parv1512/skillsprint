"use client";

import Link from "next/link";
import { useProjects } from "./project-provider";
import { Icon } from "./icon";

export function ProjectList() {
  const { projects, ready, error } = useProjects();
  return <><div className="page-heading"><div><p className="eyebrow">THE WORK / YOUR PROJECTS</p><h1>Ideas, taking shape.</h1><p className="subtitle">Each project has its own path. Your learning connects them all.</p></div><Link href="/projects/new" className="button button-primary">New project<Icon name="plus" /></Link></div>{error && <p role="alert" className="notice notice-error">{error}</p>}{!ready ? <p role="status">Opening your projects…</p> : projects.length ? <div className="project-list">{projects.map((project, index) => <article className="project-row" key={project.id}><span className="section-number">{String(index + 1).padStart(2, "0")}</span><div><h2><Link href={`/projects/${project.id}`}>{project.roadmap.title}</Link></h2><p>{project.roadmap.summary}</p><div className="project-meta"><span>{project.roadmap.milestones.length} milestones</span><span>{project.completedMilestoneIds.length} completed</span></div></div><Link href={`/projects/${project.id}`} className="text-link" aria-label={`Open roadmap for ${project.roadmap.title}`}>Open roadmap<Icon name="arrow" /></Link></article>)}</div> : <div className="studio-empty project-list-empty"><p className="eyebrow">A CLEAN PAGE</p><h2>Start with something<br />you want to make.</h2><p>Your project doesn’t have to be ambitious. It just needs to be useful to you.</p><Link href="/projects/new" className="button button-primary">Create your first roadmap<Icon name="arrow" /></Link></div>}<p className="session-footnote"><Icon name="shield" width="15" />Saved in this tab’s session only. Account persistence will arrive with sign-in.</p></>;
}
