"use client";
import { useState } from "react";
import Link from "next/link";
import { useProjects } from "./project-provider";
import { findSkill } from "@/lib/domain/skills";
import { workspaceFetch } from "@/lib/projects/remote-store";
export function SkillReuse({skillIds, projectId, onSkip}: {skillIds: string[]; projectId: string; onSkip: (skip: boolean, refresher: boolean, skillId: string) => void}) {
  const {passport, refreshPassport} = useProjects();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const reused = passport.filter(record => record.status !== "new" && skillIds.includes(record.skillId) && record.evidence.some(item => item.projectId !== projectId && item.kind === "student-work"));
  if (!reused.length) return null;
  async function choose(preference: "skip" | "review" | "refresher") {
    setBusy(true); setError("");
    try { for (const record of reused) await workspaceFetch("/api/passport", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({skillId: record.skillId, preference})}); await refreshPassport(); onSkip(preference === "skip", preference === "refresher", reused[0].skillId); }
    catch(cause) {setError(cause instanceof Error ? cause.message : "Couldn’t save preference.");} finally {setBusy(false);}
  }
  return <div className="skill-reuse"><h3>You’ve practiced this before</h3><ul>{reused.map(record => {const source = record.evidence.find(item => item.projectId !== projectId && item.kind === "student-work")!; return <li key={record.skillId}>{findSkill(record.skillId)?.name} <span className={`skill-state skill-${record.status}`}>{record.status}</span> · <Link href={`/projects/${source.projectId}`}>{source.projectTitle}</Link></li>;})}</ul><div className="workspace-actions"><button className="button button-secondary" disabled={busy} onClick={() => void choose("skip")}>Skip introduction</button><button className="button button-secondary" disabled={busy} onClick={() => void choose("review")}>Review</button><button className="button button-secondary" disabled={busy} onClick={() => void choose("refresher")}>Refresher check</button></div>{error && <p role="alert">{error}</p>}<p className="quiet-note">Lesson choices do not change task completion.</p></div>;
}
