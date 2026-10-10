"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SessionProject } from "@/lib/projects/store";
import { useProjects } from "./project-provider";
import { RoadmapView } from "./roadmap-view";
import { LearningWorkspace } from "./learning-workspace";

export function ProjectRoadmap({ id }: { id: string }) {
  const { ready, loadProject, projects } = useProjects();
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
  if (!project) return <section className="studio-empty"><p className="eyebrow">PROJECT UNAVAILABLE</p><h1>This project couldn’t be opened.</h1><p role={error ? "alert" : undefined}>{error ?? "Check that you’re signed into the account that owns this project."}</p><Link href="/projects" className="button button-primary">Back to projects</Link></section>;
  const current = projects.find((item) => item.id === id) ?? project;
  return <><Link href="/projects" className="text-link back-link">← All projects</Link><RoadmapView roadmap={current.roadmap} completedIds={current.completedMilestoneIds} renderLearning={(milestone) => <LearningWorkspace key={milestone.id} project={current} milestone={milestone} />} /></>;
}
