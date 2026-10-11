"use client";
import Link from "next/link";
import { useProjects } from "./project-provider";
import { Icon } from "./icon";
export function StudioDashboard() {
  const { projects, ready, error, passport, authenticated } = useProjects();
  const latest = projects[0];
  const demonstrated = passport.filter(record=>record.status!=="new").length;
  return <>
    <div className="studio-heading"><h1>Your workspace</h1><Link href="/projects/new" className="button button-primary">New project<Icon name="plus" /></Link></div>
    {error && <p role="alert" className="notice notice-error">{error}</p>}
    <div className="studio-grid">
      <section className="studio-projects" aria-labelledby="projects-title"><div className="studio-section-heading"><h2 id="projects-title">Projects</h2><Link href="/projects" className="text-link">View all<Icon name="arrow" width="16" /></Link></div>
        {!ready ? <p role="status" className="quiet-note">Loading projects…</p> : latest ? <div className="featured-project"><h3>{latest.roadmap.title}</h3><div className="project-meta"><span>{latest.roadmap.milestones.length} milestone{latest.roadmap.milestones.length===1?"":"s"}</span><span>~{latest.roadmap.milestones.reduce((sum, milestone) => sum + milestone.estimatedHours, 0)} hours</span><span>{latest.completedMilestoneIds.length} completed</span></div><div className="next-step"><span className="eyebrow">NEXT STEP</span><strong>{latest.roadmap.milestones.find((milestone) => !latest.completedMilestoneIds.includes(milestone.id))?.title ?? "Roadmap complete"}</strong></div><Link className="button button-primary" href={"/projects/" + latest.id}>Open roadmap<Icon name="arrow" /></Link></div> : <div className="studio-empty"><h3>No projects yet</h3><p>Turn an idea into a step-by-step roadmap.</p></div>}
      </section>
      <aside className="studio-margin"><h2>Learning Passport</h2><p>Your record of skills demonstrated in projects.</p><p>{!ready ? "Loading your Passport…" : !authenticated ? "Your skills appear here after you sign in." : demonstrated ? `${demonstrated} skill${demonstrated===1?"":"s"} supported by project evidence.` : "No skills demonstrated yet."}</p><Link href="/passport" className="text-link">View Passport<Icon name="arrow" width="16" /></Link></aside>
    </div>
  </>;
}
