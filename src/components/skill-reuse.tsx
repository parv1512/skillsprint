"use client";
import { useRef, useState } from "react";
import {useResultFocus} from "./result-focus";
import Link from "next/link";
import { useProjects } from "./project-provider";
import { findSkill } from "@/lib/domain/skills";
import { workspaceFetch } from "@/lib/projects/remote-store";
export function SkillReuse({skillIds, projectId, onSkip, lessonBusy, currentStepTitle}: {skillIds: string[]; projectId: string; onSkip: (skip: boolean, refresher: boolean, skillId: string) => void; lessonBusy: boolean; currentStepTitle?: string}) {
  const {passport, refreshPassport} = useProjects();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const errorResult=useRef<HTMLParagraphElement>(null);
  const focusResult=useResultFocus();
  const reused = passport.filter(record => record.status !== "new" && skillIds.includes(record.skillId) && record.evidence.some(item => item.projectId !== projectId && item.kind === "student-work"));
  if (!reused.length) return null;
  async function choose(preference: "skip" | "refresher") {
    setBusy(true); setError("");
    try { for (const record of reused) await workspaceFetch("/api/passport", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({skillId: record.skillId, preference})}); await refreshPassport(); onSkip(preference === "skip", preference === "refresher", reused[0].skillId); }
    catch(cause) {setError(cause instanceof Error ? cause.message : "Couldn’t save preference.");focusResult(errorResult);} finally {setBusy(false);}
  }
  const skipped = reused.filter(record => record.preference === "skip");
  return <div className="skill-reuse"><h3>You’ve practiced this before</h3>
    <ul>{reused.map(record => {const source = record.evidence.find(item => item.projectId !== projectId && item.kind === "student-work")!; return <li key={record.skillId}>{findSkill(record.skillId)?.name} <span className={`skill-state skill-${record.status}`}>{record.status}</span> · <Link href={`/projects/${source.projectId}`}>{source.projectTitle}</Link></li>;})}</ul>
    <div className="workspace-actions"><button className="button button-secondary" aria-pressed={reused.every(record => record.preference === "skip")} aria-describedby={skipped.length ? "skip-introduction-feedback" : undefined} disabled={busy || lessonBusy} onClick={() => void choose("skip")}>Skip introduction</button><button className="button button-secondary" aria-pressed={reused.every(record => record.preference === "refresher")} disabled={busy || lessonBusy} onClick={() => void choose("refresher")}>Practice this skill again</button></div>
    {skipped.length > 0 && <p id="skip-introduction-feedback" role="status" className="quiet-note">{skipped.map(record => findSkill(record.skillId)?.name).join(", ")} introduction skipped. Concept notes and example are hidden. {currentStepTitle ? `Your current building step is unchanged: ${currentStepTitle}.` : "No building steps have been created yet."}</p>}
    {error && <p ref={errorResult} tabIndex={-1} role="alert">{error}</p>}<p className="quiet-note">Practice this skill again opens the Passport check for {findSkill(reused[0].skillId)?.name}. Create a question there when ready.</p><p className="quiet-note">Lesson choices do not change task completion.</p>
  </div>;
}
