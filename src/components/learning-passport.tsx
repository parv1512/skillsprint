"use client";
import Link from "next/link";
import { useProjects } from "./project-provider";
import { findSkill } from "@/lib/domain/skills";
export function LearningPassport() {
  const {passport, ready, mode} = useProjects();
  if (!ready) return <p role="status">Loading your Passport…</p>;
  if (!passport.length) return <div className="passport-sheet"><section className="passport-sheet-main"><h2>No skills recorded yet</h2><p>{mode === "persistent" ? "Complete practical work and a targeted check to build your Passport." : "Sign in to keep your skills and project evidence."}</p></section></div>;
  return <div className="passport-records">{passport.map(record => <article key={record.skillId} className="passport-record"><div className="passport-record-heading"><div><h2>{findSkill(record.skillId)?.name}</h2><p>{findSkill(record.skillId)?.description}</p></div><span className={`skill-state skill-${record.status}`}>{record.status}</span></div>{record.lastDemonstratedAt && <p className="quiet-note">Last demonstrated {new Date(record.lastDemonstratedAt).toLocaleDateString()}</p>}
    {record.evidence.length ? <details><summary>{record.evidence.length} evidence record{record.evidence.length === 1 ? "" : "s"}</summary><ul className="passport-evidence">{record.evidence.map(item => <li key={item.id}><Link href={`/projects/${item.projectId}#milestone-detail`}>{item.projectTitle}</Link><span className="optional-label">{item.kind === "student-work" ? "Student-confirmed work" : "AI-reviewed understanding"}</span><pre className={`evidence-text ${item.kind === "student-work" ? "evidence-code" : ""}`}>{item.snapshot}</pre></li>)}</ul></details> : <p className="quiet-note">Required by a project; no demonstration recorded.</p>}
    </article>)}<p className="quiet-note">Practiced: saved work and your completion confirmation. Mastered: practical work plus a passed skill check. AI reviews do not execute code.</p></div>;
}
