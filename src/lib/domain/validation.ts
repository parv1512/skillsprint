import { z } from "zod";
import { skillIds } from "./skills";

export const skillIdSchema = z.string().regex(/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/, "Use a canonical skill identifier.");
export const skillStatusSchema = z.enum(["new", "practiced", "mastered"]);
export const reviewPreferenceSchema = z.enum(["skip", "review", "refresher"]);

export const projectIntakeSchema = z.object({
  idea: z.string().trim().min(10, "Describe your idea in at least 10 characters.").max(2000),
  experience: z.enum(["beginner", "some-experience", "intermediate"]),
  preferredStack: z.string().trim().max(200).optional(),
  availableHours: z.number().finite().min(1).max(1000),
  learningGoals: z.string().trim().min(3).max(1000),
}).strict();

export const resourceSchema = z.object({
  title: z.string().trim().min(1).max(200),
  url: z.url().refine((url) => new URL(url).protocol === "https:", "Resources must use HTTPS."),
  verified: z.boolean(),
}).strict();

const text = z.string().trim().min(1).max(3000);
export const milestoneSchema = z.object({
  id: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(160),
  outcome: text,
  skillIds: z.array(skillIdSchema).min(1).max(12),
  prerequisiteIds: z.array(z.string().min(1)).max(20),
  tasks: z.array(text).min(1).max(15),
  resources: z.array(resourceSchema).max(10),
  estimatedHours: z.number().finite().positive().max(1000),
  acceptanceCriteria: z.array(text).min(1).max(15),
  assessmentPrompt: text,
}).strict();

export const roadmapSchema = z.object({
  title: z.string().trim().min(1).max(160),
  summary: text,
  scopeNotes: z.string().trim().max(2000).default(""),
  milestones: z.array(milestoneSchema).min(1).max(20),
}).strict().superRefine((roadmap, context) => {
  const seen = new Set<string>();
  roadmap.milestones.forEach((milestone, index) => {
    if (seen.has(milestone.id)) {
      context.addIssue({ code: "custom", path: ["milestones", index, "id"], message: "Milestone identifiers must be unique." });
    }
    for (const prerequisite of milestone.prerequisiteIds) {
      if (!seen.has(prerequisite)) {
        context.addIssue({ code: "custom", path: ["milestones", index, "prerequisiteIds"], message: "Prerequisites must refer to earlier milestones." });
      }
    }
    for (const skillId of milestone.skillIds) {
      if (!skillIds.has(skillId)) {
        context.addIssue({ code: "custom", path: ["milestones", index, "skillIds"], message: "Use a skill from the canonical catalog." });
      }
    }
    seen.add(milestone.id);
  });
});
