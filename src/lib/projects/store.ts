import { z } from "zod";
import { projectIntakeSchema, roadmapSchema } from "../domain/validation";

export const sessionProjectSchema = z.object({
  id: z.uuid(),
  intake: projectIntakeSchema,
  roadmap: roadmapSchema,
  completedMilestoneIds: z.array(z.string()).max(20),
  createdAt: z.iso.datetime(),
}).strict().superRefine((project, context) => {
  const ids = new Set(project.roadmap.milestones.map((milestone) => milestone.id));
  if (new Set(project.completedMilestoneIds).size !== project.completedMilestoneIds.length || project.completedMilestoneIds.some((id) => !ids.has(id))) {
    context.addIssue({ code: "custom", path: ["completedMilestoneIds"], message: "Completion records must reference unique milestones in this project." });
  }
});

export type SessionProject = z.infer<typeof sessionProjectSchema>;

// UI depends on this boundary. Phase 4 supplies server-backed methods with ownership checks.
export interface ProjectStore {
  saveProject(project: SessionProject): Promise<void>;
  loadProject(id: string): Promise<SessionProject | null>;
  listProjects(): Promise<SessionProject[]>;
}

export class ProjectStorageError extends Error {}
