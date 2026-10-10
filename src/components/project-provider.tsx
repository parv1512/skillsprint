"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createSessionProjectStore } from "@/lib/projects/session-store";
import type { ProjectStore, SessionProject } from "@/lib/projects/store";

type Workspace = {
  projects: SessionProject[];
  ready: boolean;
  error: string | null;
  saveProject: (project: SessionProject) => Promise<void>;
  loadProject: (id: string) => Promise<SessionProject | null>;
};
const ProjectContext = createContext<Workspace | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<ProjectStore | null>(null);
  const [projects, setProjects] = useState<SessionProject[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    try {
      const sessionStore = createSessionProjectStore(window.sessionStorage);
      setStore(sessionStore);
      sessionStore.listProjects().then((items) => { if (active) setProjects(items); })
        .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Couldn’t load session projects."); })
        .finally(() => { if (active) setReady(true); });
    } catch { setError("Browser storage isn’t available. Generated roadmaps can be viewed but cannot be saved in this session."); setReady(true); }
    return () => { active = false; };
  }, []);
  const saveProject = useCallback(async (project: SessionProject) => {
    if (!store) throw new Error("This browser can’t save session projects. Your generated plan is still visible.");
    await store.saveProject(project);
    setProjects(await store.listProjects());
    setError(null);
  }, [store]);
  const loadProject = useCallback(async (id: string) => {
    if (!store) throw new Error("Your session projects aren’t available in this browser.");
    return store.loadProject(id);
  }, [store]);
  return <ProjectContext.Provider value={{ projects, ready, error, saveProject, loadProject }}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
  const workspace = useContext(ProjectContext);
  if (!workspace) throw new Error("ProjectProvider is required.");
  return workspace;
}
