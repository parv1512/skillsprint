"use client";
import { useRef, useState } from "react";
import {useResultFocus} from "./result-focus";
import Link from "next/link";
import { useProjects } from "./project-provider";
import { findSkill } from "@/lib/domain/skills";
import { workspaceFetch } from "@/lib/projects/remote-store";
export function SkillReuse({skillIds, projectId, onPractice, lessonBusy}: {skillIds: string[]; projectId: string; onPractice: (skillId: string) => void; lessonBusy: boolean}) {
  const {passport, refreshPassport} = useProjects();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const errorResult=useRef<HTMLParagraphElement>(null);
  const focusResult=useResultFocus();
  const reused = passport.filter(record => record.status !== "new" && skillIds.includes(record.skillId) && record.evidence.some(item => item.projectId !== projectId && item.kind === "student-work"));
  if (!reused.length) return null;
  async function practice() {
    setBusy(true); setError("");
    try { for (const record of reused) await workspaceFetch("/api/passport", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({skillId: record.skillId, preference: "refresher"})}); await refreshPassport(); onPractice(reused[0].skillId); }
    catch(cause) {setError(cause instanceof Error ? cause.message : "Couldn’t save preference.");focusResult(errorResult);} finally {setBusy(false);}
  }
  return <div className="skill-reuse"><h3>You’ve practiced this before</h3>
    <ul>{reused.map(record => {const source = record.evidence.find(item => item.projectId !== projectId && item.kind === "student-work")!; return <li key={record.skillId}>{findSkill(record.skillId)?.name} · <span className={`skill-state skill-${record.status}`}>{record.status}</span> · <Link href={`/projects/${source.projectId}`}>{source.projectTitle}</Link></li>;})}</ul>
    <div className="workspace-actions"><button className="button button-secondary" aria-pressed={reused.every(record => record.preference === "refresher")} disabled={busy || lessonBusy} onClick={() => void practice()}>Take the Passport check</button></div>
    {error && <p ref={errorResult} tabIndex={-1} role="alert">{error}</p>}<p className="quiet-note">Take the Passport check opens a written question for {findSkill(reused[0].skillId)?.name}. A pass can mark it mastered when your project work is already saved.</p>
  </div>;
}
