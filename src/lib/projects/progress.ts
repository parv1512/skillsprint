import type { SessionProject } from "./store";
import type { LearningActivity } from "../domain/learning";

export function confirmMilestone(project: SessionProject, milestoneId: string, activity: LearningActivity, now = new Date().toISOString()): SessionProject {
  const milestone = project.roadmap.milestones.find((item) => item.id === milestoneId);
  if (!milestone) throw new Error("This milestone isn’t in the project.");
  if (!milestone.prerequisiteIds.every((id) => project.completedMilestoneIds.includes(id))) throw new Error("Complete the prerequisite milestones first.");
  if (!milestone.acceptanceCriteria.every((_, index) => activity.checkedCriteria.includes(index))) throw new Error("Confirm each completion criterion first.");
  return { ...project, completedMilestoneIds: [...new Set([...project.completedMilestoneIds, milestoneId])], learning: { ...project.learning, [milestoneId]: { ...activity, completionConfirmedAt: now } } };
}

export function reopenMilestone(project: SessionProject, milestoneId: string): SessionProject {
  const dependent = project.roadmap.milestones.find((item) => project.completedMilestoneIds.includes(item.id) && item.prerequisiteIds.includes(milestoneId));
  if (dependent) throw new Error(`Reopen “${dependent.title}” first because it depends on this milestone.`);
  const activity = project.learning?.[milestoneId];
  return { ...project, completedMilestoneIds: project.completedMilestoneIds.filter((id) => id !== milestoneId), learning: activity ? { ...project.learning, [milestoneId]: { ...activity, completionConfirmedAt: null } } : project.learning };
}
