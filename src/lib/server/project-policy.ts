import { emptyActivity } from "../domain/learning";
import { confirmMilestone, reopenMilestone } from "../projects/progress";
import { sessionProjectSchema, type SessionProject } from "../projects/store";
import { WorkspaceError } from "./errors";

// Only student-authored fields and self-confirmed progress can be changed by a browser save.
export function applyStudentSave(current: SessionProject, submitted: SessionProject): SessionProject {
  if (current.revision !== submitted.revision) throw new WorkspaceError("This project changed in another request. Reload the milestone before saving again.", 409);
  let next: SessionProject = { ...current, learning: { ...current.learning } };
  for (const milestone of current.roadmap.milestones) {
    const prior = current.learning?.[milestone.id] ?? emptyActivity();
    const draft = submitted.learning?.[milestone.id];
    if (draft) next.learning![milestone.id] = { ...prior, work: draft.work, answer: draft.answer, checkedCriteria: draft.checkedCriteria, setupConfirmed: draft.setupConfirmed, completedStepIds: draft.completedStepIds, checkFormat: draft.checkFormat, multipleChoiceAnswer: prior.multipleChoiceQuestion ? draft.multipleChoiceAnswer : null };
  }
  // Reverse order makes reopening dependent milestones safe.
  for (const milestone of current.roadmap.milestones) {
    if (submitted.completedMilestoneIds.includes(milestone.id) && !milestone.acceptanceCriteria.every((_, index) => next.learning?.[milestone.id]?.checkedCriteria.includes(index))) {
      throw new WorkspaceError("Confirm every criterion, or reopen the milestone before changing its criteria.");
    }
  }
  for (const milestone of [...current.roadmap.milestones].reverse()) {
    if (current.completedMilestoneIds.includes(milestone.id) && !submitted.completedMilestoneIds.includes(milestone.id)) next = reopenMilestone(next, milestone.id);
  }
  for (const milestone of current.roadmap.milestones) {
    if (!current.completedMilestoneIds.includes(milestone.id) && submitted.completedMilestoneIds.includes(milestone.id)) {
      next = confirmMilestone(next, milestone.id, next.learning?.[milestone.id] ?? emptyActivity());
    }
  }
  return sessionProjectSchema.parse({ ...next, revision: current.revision + 1 });
}
export function cleanImportedProject(project: SessionProject): SessionProject {
  // Imported browser work is useful context, but its AI output and completion records are untrusted.
  return sessionProjectSchema.parse({ ...project, revision: 0, completedMilestoneIds: [], learning: Object.fromEntries(Object.entries(project.learning ?? {}).map(([id, activity]) => [id, { ...emptyActivity(), work: activity.work, answer: activity.answer }])) });
}
