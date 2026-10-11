"use client";
import { useRef, useState } from "react";
import {useResultFocus} from "./result-focus";
import Link from "next/link";
import { useProjects } from "./project-provider";
import { findSkill } from "@/lib/domain/skills";
import { workspaceFetch } from "@/lib/projects/remote-store";
export function SkillReuse({skillIds, projectId, onSkip, createReviewLesson, lessonBusy, lessonError, lessonStatus, hasGuidedSteps, currentStepTitle}: {skillIds: string[]; projectId: string; onSkip: (skip: boolean, refresher: boolean, skillId: string) => void; createReviewLesson: () => void; lessonBusy: boolean; lessonError: string | null; lessonStatus: string; hasGuidedSteps: boolean; currentStepTitle?: string}) {
  const {passport, refreshPassport} = useProjects();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const choiceResult=useRef<HTMLDivElement>(null), errorResult=useRef<HTMLParagraphElement>(null);
  const focusResult=useResultFocus();
  const reused = passport.filter(record => record.status !== "new" && skillIds.includes(record.skillId) && record.evidence.some(item => item.projectId !== projectId && item.kind === "student-work"));
  if (!reused.length) return null;
  async function choose(preference: "skip" | "review" | "refresher") {
    setBusy(true); setError("");
    try { for (const record of reused) await workspaceFetch("/api/passport", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({skillId: record.skillId, preference})}); await refreshPassport(); onSkip(preference === "skip", preference === "refresher", reused[0].skillId); if(preference==="review")focusResult(choiceResult); }
    catch(cause) {setError(cause instanceof Error ? cause.message : "Couldn’t save preference.");focusResult(errorResult);} finally {setBusy(false);}
  }
  const skipped = reused.filter(record => record.preference === "skip");
  const reviewing = reused.filter(record => record.preference === "review");
  return <div className="skill-reuse"><h3>You’ve practiced this before</h3>
    <ul>{reused.map(record => {const source = record.evidence.find(item => item.projectId !== projectId && item.kind === "student-work")!; return <li key={record.skillId}>{findSkill(record.skillId)?.name} <span className={`skill-state skill-${record.status}`}>{record.status}</span> · <Link href={`/projects/${source.projectId}`}>{source.projectTitle}</Link></li>;})}</ul>
    <div className="workspace-actions"><button className="button button-secondary" aria-pressed={reused.every(record => record.preference === "skip")} aria-describedby={skipped.length ? "skip-introduction-feedback" : undefined} disabled={busy || lessonBusy} onClick={() => void choose("skip")}>Skip introduction</button><button className="button button-secondary" aria-pressed={reused.every(record => record.preference === "review")} disabled={busy || lessonBusy} onClick={() => void choose("review")}>Review</button><button className="button button-secondary" aria-pressed={reused.every(record => record.preference === "refresher")} disabled={busy || lessonBusy} onClick={() => void choose("refresher")}>Practice this skill again</button></div>
    <div ref={choiceResult} tabIndex={-1}>
    {skipped.length > 0 && <p id="skip-introduction-feedback" role="status" className="quiet-note">{skipped.map(record => findSkill(record.skillId)?.name).join(", ")} introduction skipped. Concept notes and example are hidden. {currentStepTitle ? `Your current building step is unchanged: ${currentStepTitle}.` : "No building steps have been created yet."}</p>}
    {reviewing.length > 0 && <div className="reuse-review-action" tabIndex={-1}><p className="quiet-note">Review selected for {reviewing.map(record => findSkill(record.skillId)?.name).join(", ")}. This prepares a shorter lesson for the practiced skill. Your current steps have not changed.</p><button className="button button-secondary" disabled={busy || lessonBusy} onClick={createReviewLesson}>Create review lesson</button>{hasGuidedSteps ? <p className="quiet-note">Confirm before Gemini writes a new lesson and replaces your current steps.</p> : <p className="quiet-note">This button will create your first lesson after you confirm.</p>}{lessonStatus && <p role="status" className="quiet-note">{lessonStatus}</p>}{lessonError && <p role="alert" className="notice notice-error">{lessonError}</p>}</div>}
    </div>
    {error && <p ref={errorResult} tabIndex={-1} role="alert">{error}</p>}<p className="quiet-note">Practice this skill again opens the Passport check for {findSkill(reused[0].skillId)?.name}. Create a question there when ready.</p><p className="quiet-note">Lesson choices do not change task completion.</p>
  </div>;
}
