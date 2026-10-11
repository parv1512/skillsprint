import { z } from "zod";
import { findSkill } from "./skills";
import { skillStatusSchema, reviewPreferenceSchema } from "./validation";
export const canonicalSkillSchema = z.string().refine(id => !!findSkill(id), "Choose a canonical skill.");
export const passportEvidenceSchema = z.object({ id: z.uuid(), projectId: z.uuid(), milestoneId: z.string(), skillId: canonicalSkillSchema, kind: z.enum(["student-work", "ai-check"]), snapshot: z.string(), createdAt: z.string(), projectTitle: z.string() });
export const passportSkillSchema = z.object({ skillId: canonicalSkillSchema, status: skillStatusSchema, preference: reviewPreferenceSchema, lastDemonstratedAt: z.string().nullable(), evidence: z.array(passportEvidenceSchema) });
export const passportSchema = z.array(passportSkillSchema);
export type PassportSkill = z.infer<typeof passportSkillSchema>;
export function recordedMilestoneSkills(skills: PassportSkill[], projectId: string, milestoneId: string, work: string) {
  if (!work.trim()) return [];
  return skills.filter(skill => skill.status !== "new" && skill.evidence.some(item =>
    item.kind === "student-work" && item.skillId === skill.skillId && item.projectId === projectId &&
    item.milestoneId === milestoneId && item.snapshot.trim() === work.trim()
  )).map(({skillId,status}) => ({skillId,status}));
}
export const targetedCheckSchema = z.object({ question: z.string().trim().min(10).max(2000) }).strict();
export function evidenceStatus(items: { kind: string }[]) {
  const practical = items.some(item => item.kind === "student-work");
  return practical ? items.some(item => item.kind === "ai-check") ? "mastered" as const : "practiced" as const : "new" as const;
}
