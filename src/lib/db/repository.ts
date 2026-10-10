import "server-only";
import { createHash } from "node:crypto";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDatabase } from "./client";
import { students, projects, milestones, activities, assessments, evidence, skillRecords } from "./schema";
import { sessionProjectSchema, type SessionProject } from "../projects/store";
import { emptyActivity, type LearningActivity, type KnowledgeReview } from "../domain/learning";
import { evidenceStatus, type PassportSkill } from "../domain/passport";
import { applyStudentSave, cleanImportedProject } from "../server/project-policy";
import { WorkspaceError } from "../server/errors";
type Database = ReturnType<typeof getDatabase>;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type Query = Database | Transaction;
const ownedProject = (owner: string, id: string) => and(eq(projects.ownerId, owner), eq(projects.id, id));
const ownedActivity = (owner: string, id: string, milestone: string) => and(eq(activities.ownerId, owner), eq(activities.projectId, id), eq(activities.milestoneId, milestone));

async function readProject(db: Query, owner: string, id: string): Promise<SessionProject | null> {
  const [project] = await db.select().from(projects).where(ownedProject(owner, id));
  if (!project) return null;
  const parts = await db.select().from(milestones).where(and(eq(milestones.ownerId, owner), eq(milestones.projectId, id))).orderBy(asc(milestones.position));
  const work = await db.select().from(activities).where(and(eq(activities.ownerId, owner), eq(activities.projectId, id)));
  return sessionProjectSchema.parse({ id, revision: project.revision, createdAt: new Date(project.createdAt).toISOString(), intake: project.intake,
    roadmap: { title: project.title, summary: project.summary, scopeNotes: project.scopeNotes, milestones: parts.map(item => item.content) },
    learning: Object.fromEntries(work.map(item => [item.milestoneId, item.data])), completedMilestoneIds: work.filter(item => item.data.completionConfirmedAt).map(item => item.milestoneId) });
}
async function lockProject(db: Transaction, owner: string, id: string) {
  const rows = await db.select({id: projects.id}).from(projects).where(ownedProject(owner, id)).for("update");
  if (!rows.length) throw new WorkspaceError("Project not found.", 404);
  return (await readProject(db, owner, id))!;
}
async function writeActivities(db: Query, owner: string, project: SessionProject) {
  for (const [id, data] of Object.entries(project.learning ?? {})) {
    await db.insert(activities).values({ownerId: owner, projectId: project.id, milestoneId: id, data}).onConflictDoUpdate({target: [activities.ownerId, activities.projectId, activities.milestoneId], set: {data}});
  }
  await db.update(projects).set({revision: project.revision}).where(ownedProject(owner, project.id));
}
async function refreshSkills(db: Query, owner: string, ids: string[]) {
  for (const skillId of new Set(ids)) {
    const items = await db.select().from(evidence).where(and(eq(evidence.ownerId, owner), eq(evidence.skillId, skillId))).orderBy(desc(evidence.createdAt));
    const status = evidenceStatus(items), lastDemonstratedAt = items[0]?.createdAt ?? null;
    await db.insert(skillRecords).values({ownerId: owner, skillId, status, lastDemonstratedAt}).onConflictDoUpdate({target: [skillRecords.ownerId, skillRecords.skillId], set: {status, lastDemonstratedAt}});
  }
}

export async function repositoryFor(subject: string) {
  const db = getDatabase();
  await db.insert(students).values({subject}).onConflictDoNothing({target: students.subject});
  const [student] = await db.select().from(students).where(eq(students.subject, subject));
  const owner = student.id;
  return {
    async loadProject(id: string) { return readProject(db, owner, id); },
    async listProjects() {
      const records = await db.select({id: projects.id}).from(projects).where(eq(projects.ownerId, owner)).orderBy(desc(projects.createdAt));
      return (await Promise.all(records.map(item => readProject(db, owner, item.id)))).filter((item): item is SessionProject => !!item);
    },
    async saveProject(submitted: SessionProject) {
      return db.transaction(async tx => {
        await tx.select({id: students.id}).from(students).where(eq(students.id, owner)).for("update");
        const current = await readProject(tx, owner, submitted.id);
        if (!current) {
          // Global UUID uniqueness prevents claiming another owner's ID. Import never trusts old assessments.
          const clean = cleanImportedProject(submitted);
          const inserted = await tx.insert(projects).values({id: clean.id, ownerId: owner, intake: clean.intake, title: clean.roadmap.title, summary: clean.roadmap.summary, scopeNotes: clean.roadmap.scopeNotes, createdAt: clean.createdAt}).onConflictDoNothing().returning({id: projects.id});
          if (!inserted.length) throw new WorkspaceError("This project cannot be saved under this account.", 409);
          for (const [position, content] of clean.roadmap.milestones.entries()) await tx.insert(milestones).values({id: content.id, projectId: clean.id, ownerId: owner, position, content});
          await writeActivities(tx, owner, clean);
          for (const id of new Set(clean.roadmap.milestones.flatMap(item => item.skillIds))) await tx.insert(skillRecords).values({ownerId: owner, skillId: id}).onConflictDoNothing();
          return clean;
        }
        const locked = await lockProject(tx, owner, submitted.id);
        let next: SessionProject;
        try { next = applyStudentSave(locked, submitted); } catch(error) { if (error instanceof WorkspaceError) throw error; throw new WorkspaceError(error instanceof Error ? error.message : "Check the milestone criteria."); }
        await writeActivities(tx, owner, next);
        const awarded: string[] = [];
        for (const milestone of locked.roadmap.milestones) {
          if (next.completedMilestoneIds.includes(milestone.id) && (!locked.completedMilestoneIds.includes(milestone.id) || locked.learning?.[milestone.id]?.work !== next.learning?.[milestone.id]?.work)) {
            const activity = next.learning?.[milestone.id];
            if (activity?.work.trim()) for (const skillId of new Set(milestone.skillIds)) {
              const submissionHash = createHash("sha256").update(activity.work.trim()).digest("hex");
              await tx.insert(evidence).values({ownerId: owner, projectId: next.id, milestoneId: milestone.id, skillId, kind: "student-work", eventKey: `work:${next.id}:${milestone.id}:${submissionHash}`, snapshot: activity.work}).onConflictDoNothing();
              awarded.push(skillId);
            }
          }
        }
        await refreshSkills(tx, owner, awarded);
        return next;
      });
    },
    async saveGenerated(id: string, milestoneId: string, revision: number, update: Partial<LearningActivity>) {
      return db.transaction(async tx => {
        const project = await lockProject(tx, owner, id);
        if (project.revision !== revision) throw new WorkspaceError("Your project changed while Gemini was responding. Reload before retrying.", 409);
        const next = sessionProjectSchema.parse({...project, revision: revision + 1, learning: {...project.learning, [milestoneId]: {...(project.learning?.[milestoneId] ?? emptyActivity()), ...update}}});
        await writeActivities(tx, owner, next);
        return next;
      });
    },
    async passport(): Promise<PassportSkill[]> {
      const records = await db.select().from(skillRecords).where(eq(skillRecords.ownerId, owner)).orderBy(asc(skillRecords.skillId));
      const items = await db.select({id: evidence.id, projectId: evidence.projectId, milestoneId: evidence.milestoneId, skillId: evidence.skillId, kind: evidence.kind, snapshot: evidence.snapshot, createdAt: evidence.createdAt, projectTitle: projects.title}).from(evidence).innerJoin(projects, and(eq(projects.id, evidence.projectId), eq(projects.ownerId, owner))).where(eq(evidence.ownerId, owner)).orderBy(desc(evidence.createdAt));
      return records.map(record => ({skillId: record.skillId, status: record.status, preference: record.preference, lastDemonstratedAt: record.lastDemonstratedAt, evidence: items.filter(item => item.skillId === record.skillId)}));
    },
    async setPreference(skillId: string, preference: "skip" | "review" | "refresher") {
      await db.insert(skillRecords).values({ownerId: owner, skillId, preference}).onConflictDoUpdate({target: [skillRecords.ownerId, skillRecords.skillId], set: {preference}});
    },
    async createCheck(projectId: string, milestoneId: string, skillId: string, question: string) {
      const [check] = await db.insert(assessments).values({ownerId: owner, projectId, milestoneId, skillId, question, model: process.env.GEMINI_MODEL ?? "unknown"}).returning();
      return check;
    },
    async loadCheck(id: string) { const [check] = await db.select().from(assessments).where(and(eq(assessments.ownerId, owner), eq(assessments.id, id))); return check ?? null; },
    async listChecks(projectId: string, milestoneId: string) { return db.select().from(assessments).where(and(eq(assessments.ownerId, owner), eq(assessments.projectId, projectId), eq(assessments.milestoneId, milestoneId))).orderBy(desc(assessments.createdAt)); },
    async reviewCheck(id: string, answer: string, review: KnowledgeReview) {
      return db.transaction(async tx => {
        await tx.select({id: students.id}).from(students).where(eq(students.id, owner)).for("update");
        const [check] = await tx.select().from(assessments).where(and(eq(assessments.ownerId, owner), eq(assessments.id, id))).for("update");
        if (!check) throw new WorkspaceError("Knowledge check not found.", 404);
        if (check.reviewedAt) throw new WorkspaceError("This check has already been reviewed. Create a new check to try again.", 409);
        await lockProject(tx, owner, check.projectId);
        const now = new Date().toISOString();
        await tx.update(assessments).set({answer, review, reviewedAt: now}).where(and(eq(assessments.ownerId, owner), eq(assessments.id, id)));
        if (review.passed) {
          await tx.insert(evidence).values({ownerId: owner, projectId: check.projectId, milestoneId: check.milestoneId, skillId: check.skillId, kind: "ai-check", eventKey: `assessment:${id}`, assessmentId: id, snapshot: `${check.question}\n\n${answer}\n\nAI review: ${review.feedback}`}).onConflictDoNothing();
          await refreshSkills(tx, owner, [check.skillId]);
        }
        return {...check, answer, review, reviewedAt: now};
      });
    },
  };
}
export type WorkspaceRepository = Awaited<ReturnType<typeof repositoryFor>>;
