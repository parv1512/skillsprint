"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createSessionProjectStore } from "@/lib/projects/session-store";
import type { ProjectStore, SessionProject } from "@/lib/projects/store";
import { createRemoteProjectStore, workspaceFetch } from "@/lib/projects/remote-store";
import { passportSchema, type PassportSkill } from "@/lib/domain/passport";

type Workspace = {
  projects: SessionProject[];
  ready: boolean;
  error: string | null;
  mode: "preview" | "signed-out" | "persistent" | "unavailable";
  authenticated: boolean;
  accountLabel: string | null;
  passport: PassportSkill[];
  refreshPassport: () => Promise<void>;
  refreshWorkspace: () => Promise<void>;
  sessionProjects: SessionProject[];
  importSessionProjects: () => Promise<void>;
  saveProject: (project: SessionProject) => Promise<void>;
  loadProject: (id: string) => Promise<SessionProject | null>;
};
const ProjectContext = createContext<Workspace | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<ProjectStore | null>(null);
  const [projects, setProjects] = useState<SessionProject[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Workspace["mode"]>("unavailable");
  const [authenticated, setAuthenticated] = useState(false);
  const [accountLabel, setAccountLabel] = useState<string | null>(null);
  const [passport, setPassport] = useState<PassportSkill[]>([]);
  const [sessionProjects, setSessionProjects] = useState<SessionProject[]>([]);
  const refreshPassport = useCallback(async () => { setPassport(passportSchema.parse((await workspaceFetch("/api/passport")).skills)); }, []);
  const refreshWorkspace = useCallback(async () => {
    setReady(false); setError(null); setAccountLabel(null);
    try {
      const configuration = await workspaceFetch("/api/workspace");
      setAuthenticated(configuration.authenticated === true);
      setAccountLabel(configuration.authenticated === true && typeof configuration.accountLabel === "string" ? configuration.accountLabel : null);
      let temporary: SessionProject[] = [];
      try {temporary = await createSessionProjectStore(window.sessionStorage).listProjects();} catch { /* Storage may be unavailable; do not claim projects were preserved. */ }
      setSessionProjects(temporary);
      if (!configuration.authConfigured) {
        const preview = createSessionProjectStore(window.sessionStorage);
        setStore(null); setMode("preview"); setProjects(await preview.listProjects()); setPassport([]);
      } else if (!configuration.authenticated) {
        setStore(null); setMode("signed-out"); setProjects([]); setPassport([]);
      } else if (!configuration.storageConfigured) {
        setStore(null); setMode("unavailable"); setProjects([]); setPassport([]); setError("Persistent storage is not configured yet.");
      } else {
        const remote = createRemoteProjectStore();
        const saved = await remote.listProjects();
        setStore(remote); setMode("persistent"); setProjects(saved);
        await refreshPassport();
        setSessionProjects(temporary.filter(item => !saved.some(project => project.id === item.id)));
      }
    } catch(cause) { setMode("unavailable"); setStore(null); setAccountLabel(null); setSessionProjects([]); setError(cause instanceof Error ? cause.message : "Couldn’t load your workspace."); }
    finally { setReady(true); }
  }, [refreshPassport]);
  useEffect(() => {
    void refreshWorkspace();
  }, [refreshWorkspace]);
  const saveProject = useCallback(async (project: SessionProject) => {
    if (!store) throw new Error("Sign in to save projects. Persistent storage must be configured.");
    await store.saveProject(project);
    setProjects(await store.listProjects());
    setError(null);
    await refreshPassport();
  }, [store, refreshPassport]);
  const loadProject = useCallback(async (id: string) => {
    if (!store && mode === "preview") return projects.find(project => project.id === id) ?? null;
    if (!store) throw new Error("Sign in to load your projects.");
    return store.loadProject(id);
  }, [store, mode, projects]);
  const importSessionProjects = useCallback(async () => {
    if (!store) throw new Error("Sign in to import projects.");
    for (const project of sessionProjects) await store.saveProject(project);
    await refreshWorkspace();
  }, [store, sessionProjects, refreshWorkspace]);
  return <ProjectContext.Provider value={{ projects, ready, error, saveProject, loadProject, mode, authenticated, accountLabel, passport, refreshPassport, refreshWorkspace, sessionProjects, importSessionProjects }}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
  const workspace = useContext(ProjectContext);
  if (!workspace) throw new Error("ProjectProvider is required.");
  return workspace;
}
