"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SessionProject } from "@/lib/projects/store";
import { useProjects } from "./project-provider";
import { RoadmapView } from "./roadmap-view";
import { LearningWorkspace } from "./learning-workspace";
import { recordedMilestoneSkills } from "@/lib/domain/passport";
import { findSkill } from "@/lib/domain/skills";

export function ProjectRoadmap({ id }: { id: string }) {
  const { ready, loadProject, projects, passport, mode, error: workspaceError } = useProjects();
  const [project, setProject] = useState<SessionProject | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    loadProject(id).then((value) => { if (active) setProject(value); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Couldn’t open this project."); })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [id, ready, loadProject]);
  if (!loaded) return <p role="status" className="loading-state">Opening your roadmap…</p>;
  if (!project) {
    const signedOut = mode === "signed-out";
    const message = signedOut ? "Check that you’re signed into the account that owns this project." : workspaceError ?? error ?? "Project not found.";
    return <section className="studio-empty"><p className="eyebrow">PROJECT UNAVAILABLE</p><h1>{!signedOut && !workspaceError && !error ? "Project not found" : "This project couldn’t be opened."}</h1><p role={error || workspaceError ? "alert" : undefined}>{message}</p><Link href="/projects" className="button button-primary">Back to projects</Link></section>;
  }
  const current = projects.find((item) => item.id === id) ?? project;
  return <><Link href="/projects" className="text-link back-link">← All projects</Link><RoadmapView roadmap={current.roadmap} completedIds={current.completedMilestoneIds}
    renderMilestoneResult={milestone => {
      if(!current.completedMilestoneIds.includes(milestone.id))return null;
      const recorded=recordedMilestoneSkills(passport.filter(skill=>milestone.skillIds.includes(skill.skillId)),current.id,milestone.id,current.learning?.[milestone.id]?.work ?? "");
      if(!recorded.length)return null;
      return <div className="quiet-note" aria-label="Recorded Passport skills">{recorded.map(skill=><div key={skill.skillId}>{findSkill(skill.skillId)?.name ?? skill.skillId} is on your Learning Passport · <strong>{skill.status}</strong>.</div>)}<Link href="/passport" className="text-link">View Learning Passport</Link></div>;
    }}
    renderLearning={(milestone) => <LearningWorkspace key={milestone.id} project={current} milestone={milestone} />} /></>;
}
