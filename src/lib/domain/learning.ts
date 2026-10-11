import { z } from "zod";
import { projectIntakeSchema, roadmapSchema } from "./validation";
import { starterSchema, starterPathSchema } from "./starter";

const text = z.string().trim().min(1).max(4000);
export const guidedStepSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]{0,59}$/),
  title: z.string().trim().min(1).max(120),
  filePath: starterPathSchema,
  concept: z.string().trim().min(1).max(700).describe("Explain the concept and why this edit matters in 2-3 short beginner-friendly sentences, not just a topic label."),
  instruction: z.string().trim().min(1).max(1200),
  exampleCode: z.string().max(1200).describe("Use an empty string or a small 1-6 line illustration. Never include a whole component or the complete task solution.").refine(code => code.trim().split("\n").length <= 8, "Keep guided examples to eight lines."),
  expectedResult: z.string().trim().min(1).max(600),
  verification: z.string().trim().min(1).max(700),
  reflection: z.string().trim().min(1).max(500),
}).strict();
export const lessonSchema = z.object({
  sections: z.array(z.object({ title: z.string().min(1).max(160), explanation: text }).strict()).min(1).max(5),
  example: z.object({ language: z.string().max(40), code: z.string().min(1).max(8000), explanation: text }).strict(),
  knowledgeCheck: z.string().min(1).max(2000),
  // Saved lessons from earlier checkpoints remain readable.
  guidedSteps: z.array(guidedStepSchema).max(8).default([]),
}).strict();
export const guidedLessonSchema = lessonSchema.extend({guidedSteps: z.array(guidedStepSchema).min(2).max(8)}).superRefine((lesson, ctx) => {
  if (new Set(lesson.guidedSteps.map(step => step.id)).size !== lesson.guidedSteps.length) ctx.addIssue({code: "custom", path: ["guidedSteps"], message: "Use unique step identifiers."});
});
export const reviewSchema = z.object({ passed: z.boolean(), feedback: text, nextStep: text }).strict();
export const knowledgeCheckFormatSchema = z.enum(["multiple-choice", "short-answer"]);
export const multipleChoiceQuestionSchema = z.object({
  question: z.string().trim().min(10).max(2000),
  options: z.array(z.string().trim().min(1).max(500)).length(4),
  correctOption: z.number().int().min(0).max(3),
  explanation: z.string().trim().min(1).max(500),
}).strict().refine(value => new Set(value.options.map(option => option.toLowerCase())).size === 4, "Use four distinct options.");
export function gradeMultipleChoice(question: z.infer<typeof multipleChoiceQuestionSchema>, selected: number) {
  return Number.isInteger(selected) && selected >= 0 && selected < 4 && selected === question.correctOption;
}
export const tutorReplySchema = z.object({ explanation: text, code: z.string().max(8000), nextStep: text }).strict();
export const tutorModeSchema = z.enum(["hint", "explain", "debug", "review", "example", "solution"]);
export const tutorMessageSchema = z.object({ role: z.enum(["student", "tutor"]), text: z.string().min(1).max(16000), code: z.string().max(8000).optional(), nextStep: z.string().max(4000).optional() }).strict();
export const learningRequestSchema = z.object({
  action: z.enum(["lesson", "tutor", "check", "starter", "quiz", "milestone-quiz"]),
  checkFormat: knowledgeCheckFormatSchema.default("short-answer"),
  skillId: z.string().optional(),
  skipSkillIds: z.array(z.string()).max(12).default([]),
  intake: projectIntakeSchema,
  roadmap: roadmapSchema,
  milestoneId: z.string().min(1).max(80),
  mode: tutorModeSchema.optional(),
  question: z.string().trim().max(2000).default(""),
  work: z.string().max(12000).default(""),
  answer: z.string().trim().max(4000).default(""),
  knowledgeCheck: z.string().max(2000).default(""),
  history: z.array(tutorMessageSchema).max(12).default([]),
  starter: starterSchema.optional(),
  previousMilestones: z.array(z.object({
    milestoneId: z.string().min(1).max(80),
    title: z.string().min(1).max(160),
    skillIds: z.array(z.string()).max(12),
    milestoneConfirmed: z.boolean(),
    tasks: z.array(z.string().max(3000)).max(15),
    confirmedSteps: z.array(guidedStepSchema.pick({title: true, filePath: true, instruction: true, expectedResult: true})).max(8),
  }).strict()).max(20).default([]),
}).strict().superRefine((input, ctx) => {
  const earlierIds = new Set(input.roadmap.milestones.slice(0, input.roadmap.milestones.findIndex(item => item.id === input.milestoneId)).map(item => item.id));
  if (input.previousMilestones.some(item => !earlierIds.has(item.milestoneId))) ctx.addIssue({code: "custom", path: ["previousMilestones"], message: "Prior work must belong to an earlier milestone."});
  if (!input.roadmap.milestones.some((item) => item.id === input.milestoneId)) ctx.addIssue({ code: "custom", path: ["milestoneId"], message: "Choose a milestone in this project." });
  if (input.skillId && !input.roadmap.milestones.find(item => item.id === input.milestoneId)?.skillIds.includes(input.skillId)) ctx.addIssue({ code: "custom", path: ["skillId"], message: "Choose a skill in this milestone." });
  if (input.action === "quiz" && !input.skillId) ctx.addIssue({ code: "custom", path: ["skillId"], message: "Choose a skill for this check." });
  if (input.skipSkillIds.some(id => !input.roadmap.milestones.find(item => item.id === input.milestoneId)?.skillIds.includes(id))) ctx.addIssue({code: "custom", path: ["skipSkillIds"], message: "Skipped introductions must belong to this milestone."});
  if (input.action === "starter" && input.roadmap.milestones[0]?.id !== input.milestoneId) ctx.addIssue({ code: "custom", path: ["milestoneId"], message: "Starter files belong to the first milestone." });
  if (input.action === "tutor" && (!input.mode || !input.question)) ctx.addIssue({ code: "custom", path: ["question"], message: "Choose a help mode and enter a question." });
  if (input.action === "check" && (!input.answer || !input.knowledgeCheck)) ctx.addIssue({ code: "custom", path: ["answer"], message: "Answer the knowledge check first." });
});
export const learningActivitySchema = z.object({
  lesson: lessonSchema.optional(),
  starter: starterSchema.optional(),
  work: z.string().max(12000).default(""),
  answer: z.string().max(4000).default(""),
  review: reviewSchema.nullable().default(null),
  reviewedAnswer: z.string().max(4000).default(""),
  checkedCriteria: z.array(z.number().int().min(0).max(14)).max(15).default([]),
  messages: z.array(tutorMessageSchema).max(12).default([]),
  completionConfirmedAt: z.iso.datetime().nullable().default(null),
  setupConfirmed: z.boolean().default(false),
  completedStepIds: z.array(z.string().min(1).max(60)).max(8).default([]),
  checkFormat: knowledgeCheckFormatSchema.default("short-answer"),
  shortQuestion: z.string().max(2000).default(""),
  multipleChoiceQuestion: multipleChoiceQuestionSchema.nullable().default(null),
  multipleChoiceAnswer: z.number().int().min(0).max(3).nullable().default(null),
}).strict();
export type LearningActivity = z.infer<typeof learningActivitySchema>;
export type LearningRequest = z.infer<typeof learningRequestSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type GuidedStep = z.infer<typeof guidedStepSchema>;
export type TutorMode = z.infer<typeof tutorModeSchema>;
export type TutorReply = z.infer<typeof tutorReplySchema>;
export type KnowledgeReview = z.infer<typeof reviewSchema>;
export const emptyActivity = (): LearningActivity => learningActivitySchema.parse({});
