"use client";

import Link from "next/link";
import { useProjects } from "./project-provider";
import { Icon } from "./icon";

export function StudioDashboard() {
  const { projects, ready, error } = useProjects();
  const latest = projects[0];
  return <>
    <div className="studio-heading"><div><p className="eyebrow">FIELD NOTES / YOUR WORKSPACE</p><h1>Good work starts<br />with a little curiosity.</h1><p className="subtitle">A place for your ideas, the things you build,<br className="desktop-break" /> and the skills you take with you.</p></div><Link href="/projects/new" className="button button-primary">Start a project<Icon name="arrow" /></Link></div>
    {error && <p role="alert" className="notice notice-error">{error}</p>}
    <div className="studio-grid">
      <section className="studio-projects" aria-labelledby="projects-title"><div className="studio-section-heading"><div><span className="section-number">01</span><h2 id="projects-title">The workbench</h2></div><Link href="/projects" className="text-link">All projects<Icon name="arrow" width="16" /></Link></div>
        {!ready ? <p role="status" className="quiet-note">Opening your session projects…</p> : latest ? <div className="featured-project"><p className="eyebrow">YOUR LATEST PROJECT</p><h3>{latest.roadmap.title}</h3><p>{latest.roadmap.summary}</p><div className="project-meta"><span>{latest.roadmap.milestones.length} milestones</span><span>{latest.roadmap.milestones.reduce((sum, milestone) => sum + milestone.estimatedHours, 0)} estimated hours</span><span>{latest.completedMilestoneIds.length} completed</span></div><div className="next-step"><span className="eyebrow">NEXT ON YOUR ROADMAP</span><strong>{latest.roadmap.milestones.find((milestone) => !latest.completedMilestoneIds.includes(milestone.id))?.title ?? "Roadmap complete"}</strong></div><Link className="button button-primary" href={`/projects/${latest.id}`}>Open roadmap<Icon name="arrow" /></Link></div> : <div className="studio-empty"><span className="sketch-bracket" aria-hidden="true">[ &nbsp; ]</span><h3>Something you want<br />to bring into the world.</h3><p>A study planner that fits your week. A budget tracker you’ll actually use. A small tool that makes someone’s day easier.</p><Link className="text-link" href="/projects/new">Start with your idea<Icon name="arrow" width="16" /></Link></div>}
        <p className="session-footnote"><Icon name="shield" width="15" />Temporary session: projects survive refreshes, but aren’t saved to your account yet.</p>
      </section>
      <aside className="studio-margin"><span className="section-number">02 / LEARNING PASSPORT</span><h2>The project ends.<br />The learning stays.</h2><p>Your Passport will connect demonstrated skills to the work where you learned them. The next project starts from what you know.</p><div className="evidence-note"><span className="margin-rule" /><p>No evidence recorded yet.<br /><span>Reading a lesson is a beginning. Demonstrating a skill is what counts.</span></p></div><Link href="/passport" className="text-link">Open your Passport<Icon name="arrow" width="16" /></Link></aside>
    </div>
    <section className="method-strip" aria-labelledby="method-title"><div><p className="eyebrow">A PRACTICAL WAY TO LEARN</p><h2 id="method-title">From an idea<br />to something that works.</h2></div><ol><li><span>01 / PLAN</span><p>A roadmap shaped around your experience, goals, and available time.</p></li><li><span>02 / BUILD</span><p>One focused milestone at a time, with clear tasks and ways to check your understanding.</p></li><li><span>03 / CARRY FORWARD</span><p>Demonstrated skills become the starting point for your next project.</p></li></ol></section>
  </>;
}
