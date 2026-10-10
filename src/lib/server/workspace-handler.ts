import { z } from "zod";
import type { WorkspaceRepository } from "../db/repository";
import { sessionProjectSchema } from "../projects/store";
import { canonicalSkillSchema, targetedCheckSchema } from "../domain/passport";
import { reviewPreferenceSchema } from "../domain/validation";
import { emptyActivity, learningRequestSchema, lessonSchema, reviewSchema, tutorModeSchema, tutorReplySchema, type LearningRequest } from "../domain/learning";
import { starterSchema } from "../domain/starter";
import { WorkspaceError } from "./errors";
import { RoadmapError } from "../ai/roadmap";

type Dependencies = { identity: () => Promise<string | null>; repository: (subject: string) => Promise<WorkspaceRepository>; generate: (input: LearningRequest) => Promise<unknown> };
export async function readJson(request: Request, max = 8_000_000) {
  const url = new URL(request.url);
  if (request.headers.get("origin") !== `${url.protocol}//${request.headers.get("host") ?? url.host}`) throw new WorkspaceError("Use this action from SkillSprint.", 403);
  if (!request.headers.get("content-type")?.includes("application/json")) throw new WorkspaceError("Send JSON data.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new WorkspaceError("The request could not be read.");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const {done, value} = await reader.read(); if (done) break; size += value.byteLength; if (size > max) { await reader.cancel(); throw new WorkspaceError("This request is too large.", 413); } chunks.push(value); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown; } catch { throw new WorkspaceError("The request could not be read."); }
}
export function safeFailure(error: unknown) {
  if (error instanceof WorkspaceError || error instanceof RoadmapError) return Response.json({error: error.message}, {status: error.status, headers: {"Cache-Control": "no-store"}});
  if (error instanceof z.ZodError) return Response.json({error: "Check the submitted details."}, {status: 400, headers: {"Cache-Control": "no-store"}});
  return Response.json({error: "Your workspace is temporarily unavailable. Your input is still here; please retry."}, {status: 503, headers: {"Cache-Control": "no-store"}});
}
const learningBody = z.object({ projectId: z.uuid(), revision: z.number().int().nonnegative().default(0), milestoneId: z.string().min(1).max(80), action: z.enum(["lesson", "tutor", "check", "starter"]), mode: tutorModeSchema.optional(), question: z.string().trim().max(2000).default(""), work: z.string().max(12000).default(""), answer: z.string().trim().max(4000).default("") }).strict();
const checkBody = z.discriminatedUnion("action", [
  z.object({action: z.literal("generate"), projectId: z.uuid(), milestoneId: z.string().min(1).max(80), skillId: canonicalSkillSchema}).strict(),
  z.object({action: z.literal("review"), checkId: z.uuid(), answer: z.string().trim().min(3).max(4000)}).strict(),
]);
function context(project: Awaited<ReturnType<WorkspaceRepository["loadProject"]>> & {}, milestoneId: string) {
  const {learningGoals: _legacy, ...intake} = project.intake;
  return {intake, roadmap: project.roadmap, milestoneId, starter: project.learning?.[project.roadmap.milestones[0].id]?.starter};
}
export async function handleWorkspace(request: Request, operation: "projects" | "project" | "passport" | "preference" | "learning" | "skill-check", dependencies: Dependencies, id?: string) {
  try {
    const subject = await dependencies.identity();
    if (!subject) throw new WorkspaceError("Sign in to use your learning workspace.", 401);
    // Reject cross-origin mutations before creating profiles or accessing storage.
    const body = request.method === "GET" ? undefined : await readJson(request, operation === "learning" || operation === "skill-check" ? 300_000 : 8_000_000);
    const repo = await dependencies.repository(subject);
    let value: unknown;
    if (operation === "projects") value = request.method === "GET" ? {projects: await repo.listProjects()} : {project: await repo.saveProject(sessionProjectSchema.parse(body))};
    if (operation === "project") {
      const project = await repo.loadProject(z.uuid().parse(id));
      if (!project) throw new WorkspaceError("Project not found.", 404);
      value = {project};
    }
    if (operation === "passport") value = {skills: await repo.passport()};
    if (operation === "preference") {
      const input = z.object({skillId: canonicalSkillSchema, preference: reviewPreferenceSchema}).strict().parse(body);
      await repo.setPreference(input.skillId, input.preference); value = {saved: true};
    }
    if (operation === "learning") {
      const input = learningBody.parse(body), project = await repo.loadProject(input.projectId);
      if (!project) throw new WorkspaceError("Project not found.", 404);
      if (project.revision !== input.revision) throw new WorkspaceError("This project changed since you opened it. Keep your unsaved work, then reload before requesting help.", 409);
      const activity = project.learning?.[input.milestoneId] ?? emptyActivity();
      const milestone = project.roadmap.milestones.find(item => item.id === input.milestoneId);
      if (!milestone) throw new WorkspaceError("Milestone not found.", 404);
      if (input.action === "tutor" && (!input.mode || !input.question)) throw new WorkspaceError("Choose a help mode and enter a question.");
      const {projectId: _projectId, revision: _revision, ...details} = input;
      const priorSkills = await repo.passport();
      const skipSkillIds = priorSkills.filter(record => record.status !== "new" && record.preference === "skip" && milestone.skillIds.includes(record.skillId) && record.evidence.some(item => item.projectId !== project.id && item.kind === "student-work")).map(record => record.skillId);
      const aiInput = learningRequestSchema.parse({...context(project, input.milestoneId), ...details, skipSkillIds, knowledgeCheck: activity.lesson?.knowledgeCheck ?? milestone.assessmentPrompt, history: activity.messages});
      const result = await dependencies.generate(aiInput);
      let update = {};
      if (input.action === "lesson") update = {lesson: lessonSchema.parse(result), review: null, reviewedAnswer: ""};
      if (input.action === "starter") update = {starter: starterSchema.parse(result)};
      if (input.action === "check") update = {review: reviewSchema.parse(result), answer: input.answer, reviewedAnswer: input.answer};
      if (input.action === "tutor") { const reply = tutorReplySchema.parse(result); update = {messages: [...activity.messages, {role: "student", text: `${input.mode}: ${input.question}`}, {role: "tutor", text: reply.explanation, code: reply.code, nextStep: reply.nextStep}].slice(-12)}; }
      const updated = await repo.saveGenerated(project.id, input.milestoneId, project.revision, update);
      value = {result, project: updated};
    }
    if (operation === "skill-check") {
      if (request.method === "GET") {
        const query = new URL(request.url).searchParams;
        const projectId = z.uuid().parse(query.get("projectId")), milestoneId = z.string().min(1).max(80).parse(query.get("milestoneId"));
        const project = await repo.loadProject(projectId);
        if (!project || !project.roadmap.milestones.some(item => item.id === milestoneId)) throw new WorkspaceError("Milestone not found.", 404);
        return Response.json({checks: await repo.listChecks(projectId, milestoneId)}, {headers: {"Cache-Control": "no-store"}});
      }
      const input = checkBody.parse(body);
      if (input.action === "generate") {
        const project = await repo.loadProject(input.projectId);
        if (!project) throw new WorkspaceError("Project not found.", 404);
        const aiInput = learningRequestSchema.parse({...context(project, input.milestoneId), action: "quiz", skillId: input.skillId});
        const quiz = targetedCheckSchema.parse(await dependencies.generate(aiInput));
        value = {check: await repo.createCheck(project.id, input.milestoneId, input.skillId, quiz.question)};
      } else {
        const check = await repo.loadCheck(input.checkId);
        if (!check) throw new WorkspaceError("Knowledge check not found.", 404);
        if (check.reviewedAt) throw new WorkspaceError("This check has already been reviewed. Create another to retry.", 409);
        const project = await repo.loadProject(check.projectId);
        if (!project) throw new WorkspaceError("Project not found.", 404);
        const aiInput = learningRequestSchema.parse({...context(project, check.milestoneId), action: "check", skillId: check.skillId, knowledgeCheck: check.question, answer: input.answer, work: project.learning?.[check.milestoneId]?.work ?? ""});
        const review = reviewSchema.parse(await dependencies.generate(aiInput));
        value = {check: await repo.reviewCheck(check.id, input.answer, review)};
      }
    }
    return Response.json(value, {headers: {"Cache-Control": "no-store"}});
  } catch(error) { return safeFailure(error); }
}
