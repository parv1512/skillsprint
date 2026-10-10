import { z } from "zod";
import { ProjectStorageError, sessionProjectSchema, type ProjectStore, type SessionProject } from "./store";

const STORAGE_KEY = "skillsprint.projects.v1";
const workspaceSchema = z.object({ version: z.literal(1), projects: z.array(sessionProjectSchema).max(50) }).strict();
type StorageAccess = Pick<Storage, "getItem" | "setItem">;

export function createSessionProjectStore(storage: StorageAccess): ProjectStore {
  async function listProjects(): Promise<SessionProject[]> {
    let value: string | null;
    try { value = storage.getItem(STORAGE_KEY); }
    catch { throw new ProjectStorageError("This browser couldn’t read your session projects. Check browser storage permissions."); }
    if (!value) return [];
    try { return workspaceSchema.parse(JSON.parse(value)).projects; }
    catch { throw new ProjectStorageError("Your session project data couldn’t be read. It hasn’t been overwritten. Try a fresh tab to start a new session."); }
  }

  return {
    listProjects,
    async loadProject(id) { return (await listProjects()).find((project) => project.id === id) ?? null; },
    async saveProject(project) {
      const validated = sessionProjectSchema.parse(project);
      const projects = await listProjects();
      const index = projects.findIndex((item) => item.id === validated.id);
      if (index >= 0) projects[index] = validated;
      else projects.unshift(validated);
      if (projects.length > 50) throw new ProjectStorageError("This temporary workspace has reached its 50-project limit. Open a fresh tab for a new session.");
      try { storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, projects })); }
      catch { throw new ProjectStorageError("This browser couldn’t save your roadmap. Your generated plan is still visible below."); }
    },
  };
}
