import { sessionProjectSchema, ProjectStorageError, type ProjectStore } from "./store";
export async function workspaceFetch(url: string, init?: RequestInit) {
  const response = await fetch(url, {...init, cache: "no-store", credentials: "same-origin"});
  const body = await response.json();
  if (!response.ok) throw new ProjectStorageError(typeof body.error === "string" ? body.error : "Your workspace could not be loaded.");
  return body;
}
export function createRemoteProjectStore(): ProjectStore {
  return {
    async listProjects() { return sessionProjectSchema.array().parse((await workspaceFetch("/api/projects")).projects); },
    async loadProject(id) {
      const response = await fetch(`/api/projects/${encodeURIComponent(id)}`, {cache: "no-store", credentials: "same-origin"});
      if (response.status === 404) return null;
      const body = await response.json(); if (!response.ok) throw new ProjectStorageError(body.error ?? "Couldn’t load project.");
      return sessionProjectSchema.parse(body.project);
    },
    async saveProject(project) { await workspaceFetch("/api/projects", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(sessionProjectSchema.parse(project))}); },
  };
}
