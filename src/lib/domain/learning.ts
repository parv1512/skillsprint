import { z } from "zod";
import { projectIntakeSchema, roadmapSchema } from "./validation";
import { starterSchema } from "./starter";

const text = z.string().trim().min(1).max(4000);
export const lessonSchema = z.object({
  sections: z.array(z.object({ title: z.string().min(1).max(160), explanation: text }).strict()).min(1).max(5),
  example: z.object({ language: z.string().max(40), code: z.string().min(1).max(8000), explanation: text }).strict(),
  knowledgeCheck: z.string().min(1).max(2000),
}).strict();
export const reviewSchema = z.object({ passed: z.boolean(), feedback: text, nextStep: text }).strict();
export const tutorReplySchema = z.object({ explanation: text, code: z.string().max(8000), nextStep: text }).strict();
export const tutorModeSchema = z.enum(["hint", "explain", "debug", "review", "example", "solution"]);
export const tutorMessageSchema = z.object({ role: z.enum(["student", "tutor"]), text: z.string().min(1).max(16000), code: z.string().max(8000).optional(), nextStep: z.string().max(4000).optional() }).strict();
export const learningRequestSchema = z.object({
  action: z.enum(["lesson", "tutor", "check", "starter"]),
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
}).strict().superRefine((input, ctx) => {
  if (!input.roadmap.milestones.some((item) => item.id === input.milestoneId)) ctx.addIssue({ code: "custom", path: ["milestoneId"], message: "Choose a milestone in this project." });
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
}).strict();
export type LearningActivity = z.infer<typeof learningActivitySchema>;
export type LearningRequest = z.infer<typeof learningRequestSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type TutorMode = z.infer<typeof tutorModeSchema>;
export type TutorReply = z.infer<typeof tutorReplySchema>;
export type KnowledgeReview = z.infer<typeof reviewSchema>;
export const emptyActivity = (): LearningActivity => learningActivitySchema.parse({});
