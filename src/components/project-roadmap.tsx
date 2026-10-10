"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SessionProject } from "@/lib/projects/store";
import { useProjects } from "./project-provider";
import { RoadmapView } from "./roadmap-view";

export function ProjectRoadmap({ id }: { id: string }) {
  const { ready, loadProject } = useProjects();
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
  if (!project) return <section className="studio-empty"><p className="eyebrow">PROJECT UNAVAILABLE</p><h1>This project isn’t in this session.</h1><p role={error ? "alert" : undefined}>{error ?? "Temporary projects live in the tab where they were created. Check your original tab, or start a new project."}</p><Link href="/projects" className="button button-primary">Back to projects</Link></section>;
  return <><Link href="/projects" className="text-link back-link">← All projects</Link><RoadmapView roadmap={project.roadmap} completedIds={project.completedMilestoneIds} /></>;
}
