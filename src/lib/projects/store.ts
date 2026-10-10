import { z } from "zod";
import { projectIntakeSchema, roadmapSchema } from "../domain/validation";
import { learningActivitySchema } from "../domain/learning";

export const sessionProjectSchema = z.object({
  id: z.uuid(),
  // Preserve older session projects without interpreting their goals as prior knowledge.
  intake: projectIntakeSchema.extend({
    existingKnowledge: projectIntakeSchema.shape.existingKnowledge.default("Not provided"),
    learningGoals: z.string().trim().min(3).max(1000).optional(),
  }),
  roadmap: roadmapSchema,
  completedMilestoneIds: z.array(z.string()).max(20),
  createdAt: z.iso.datetime(),
  learning: z.record(z.string(), learningActivitySchema).optional(),
}).strict().superRefine((project, context) => {
  const ids = new Set(project.roadmap.milestones.map((milestone) => milestone.id));
  for (const [id, activity] of Object.entries(project.learning ?? {})) {
    const milestone = project.roadmap.milestones.find((item) => item.id === id);
    if (!milestone || new Set(activity.checkedCriteria).size !== activity.checkedCriteria.length || activity.checkedCriteria.some((index) => index >= milestone.acceptanceCriteria.length)) {
      context.addIssue({ code: "custom", path: ["learning", id], message: "Learning work must reference this milestone and its criteria." });
    }
  }
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
