"use client";
import { useEffect, useRef, useState } from "react";
import {isEditingField, useResultFocus} from "./result-focus";
import { z } from "zod";
import { findSkill } from "@/lib/domain/skills";
import { canonicalSkillSchema } from "@/lib/domain/passport";
import { reviewSchema } from "@/lib/domain/learning";
import { workspaceFetch } from "@/lib/projects/remote-store";
import { useProjects } from "./project-provider";
const checkSchema = z.object({id: z.uuid(), skillId: canonicalSkillSchema, question: z.string(), answer: z.string(), review: reviewSchema.nullable(), reviewedAt: z.string().nullable()});
type Check = z.infer<typeof checkSchema>;
export function SkillCheck({projectId, milestoneId, skillIds, expanded, preferredSkillId, showResult}: {projectId: string; milestoneId: string; skillIds: string[]; expanded?: boolean; preferredSkillId?: string; showResult?: () => void}) {
  const {mode, refreshPassport} = useProjects();
  const [skillId, setSkillId] = useState(skillIds[0]), [checks, setChecks] = useState<Check[]>([]), [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [open,setOpen]=useState(!!expanded);
  const questionResult=useRef<HTMLParagraphElement>(null), reviewResult=useRef<HTMLDivElement>(null), errorResult=useRef<HTMLParagraphElement>(null);
  const focusResult=useResultFocus();
  useEffect(()=>{if(expanded)setOpen(true);},[expanded]);
  const current = checks.find(item => item.skillId === skillId);
  const previousChecks = checks.filter(item => item.skillId === skillId && item.id !== current?.id && item.reviewedAt && item.review);
  const previousResult = previousChecks.find(item => item.review?.passed) ?? previousChecks[0];
  useEffect(() => {if (preferredSkillId) {setSkillId(preferredSkillId); setAnswer("");}}, [preferredSkillId]);
  useEffect(() => {
    if (mode !== "persistent") return;
    let active = true;
    workspaceFetch(`/api/skill-checks?projectId=${encodeURIComponent(projectId)}&milestoneId=${encodeURIComponent(milestoneId)}`).then(body => {if (active) setChecks(checkSchema.array().parse(body.checks));}).catch(cause => {if (active) setError(cause instanceof Error ? cause.message : "Couldn’t load checks.");});
    return () => {active = false;};
  }, [projectId, milestoneId, mode]);
  async function run(action: "generate" | "review") {
    if (busy) return; setBusy(true); setError("");
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 130000);
    try {
      const input = action === "generate" ? {action, projectId, milestoneId, skillId} : {action, checkId: current?.id, answer};
      const body = await workspaceFetch("/api/skill-checks", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(input), signal: controller.signal});
      const check = checkSchema.parse(body.check); setChecks(prior => [check, ...prior.filter(item => item.id !== check.id)]);
      if (action === "generate") setAnswer("");
      await refreshPassport();
      if(!isEditingField()){setOpen(true);showResult?.();focusResult(action==="generate"?questionResult:reviewResult);}
    } catch(cause) {setError(controller.signal.aborted ? "The check timed out. Your answer is still here; retry." : cause instanceof Error ? cause.message : "Couldn’t review your answer.");if(!isEditingField()){setOpen(true);showResult?.();focusResult(errorResult);}}
    finally {clearTimeout(timer); setBusy(false);}
  }
  return <details className="targeted-check" open={open} onToggle={event=>setOpen(event.currentTarget.open)}><summary>Passport skill check</summary><div className="form-field"><label htmlFor="passport-check-skill">Check a skill</label><select id="passport-check-skill" value={skillId} disabled={busy} onChange={event => {setSkillId(event.target.value); setAnswer(""); setError("");}}>{skillIds.map(id => <option key={id} value={id}>{findSkill(id)?.name}</option>)}</select></div>
    {error && <p ref={errorResult} tabIndex={-1} role="alert" className="notice notice-error">{error}</p>}
    {busy && <p role="status">Gemini is responding… Up to two minutes.</p>}
    {!current || current.reviewedAt ? <button className="button button-secondary" disabled={busy || mode !== "persistent"} onClick={() => void run("generate")}>{current ? "Try another check" : "Create skill check"}</button> : null}
    {current && <><p ref={questionResult} tabIndex={-1}>{current.question}</p>{current.reviewedAt ? <div ref={reviewResult} tabIndex={-1} className="notice"><strong>{current.review?.passed ? "Passed" : "Keep practicing"} · AI review</strong><p>{current.review?.feedback}</p><p>{current.review?.nextStep}</p><details><summary>Your saved answer</summary><p>{current.answer}</p></details></div> : <><div className="form-field"><label htmlFor="passport-check-answer">Your explanation</label><textarea id="passport-check-answer" rows={4} maxLength={4000} value={answer} disabled={busy} onChange={event => setAnswer(event.target.value)} /></div><button className="button button-primary" disabled={busy || answer.trim().length < 3} onClick={() => void run("review")}>Review this skill</button></> }</>}
    {previousResult && <>{previousResult.review?.passed && <p className="quiet-note">Your pass is saved. This new question does not erase it.</p>}<details><summary>Previous result</summary><div className="notice"><strong>{previousResult.review?.passed ? "Passed" : "Keep practicing"} · AI review</strong><p>{previousResult.question}</p><p>{previousResult.review?.feedback}</p><p>{previousResult.review?.nextStep}</p><details><summary>Your saved answer</summary><p>{previousResult.answer}</p></details></div></details></>}
    <p className="quiet-note">Only this skill is assessed. A pass supports mastery when practical work is also recorded. Code is not executed.</p>
  </details>;
}
