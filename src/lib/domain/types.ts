import type { z } from "zod";
import type { milestoneSchema, projectIntakeSchema, reviewPreferenceSchema, roadmapSchema, skillStatusSchema } from "./validation";

export type ProjectIntake = z.infer<typeof projectIntakeSchema>;
export type Roadmap = z.infer<typeof roadmapSchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
export type SkillStatus = z.infer<typeof skillStatusSchema>;
export type ReviewPreference = z.infer<typeof reviewPreferenceSchema>;

// Contracts only: persistence and evidence rules are reviewed in Phase 4.
export type LearningEvidence = {
  id: string;
  projectId: string;
  milestoneId: string;
  skillId: string;
  kind: "student-submission" | "verified-assessment" | "completion-record";
  description: string;
  recordedAt: string;
};

export type PassportSkill = {
  skillId: string;
  name: string;
  description: string;
  status: SkillStatus;
  evidence: LearningEvidence[];
  lastDemonstratedAt: string | null;
  reviewPreference?: ReviewPreference;
};

export type Project = {
  id: string;
  ownerId: string;
  intake: ProjectIntake;
  roadmap: Roadmap;
  completedMilestoneIds: string[];
  createdAt: string;
};
