"use client";
import { useEffect, useRef, useState } from "react";
import type { Milestone } from "@/lib/domain/types";
import { emptyActivity, lessonSchema, reviewSchema, tutorReplySchema, type LearningActivity, type LearningRequest, type TutorMode } from "@/lib/domain/learning";
import { sessionProjectSchema, type SessionProject } from "@/lib/projects/store";
import { findSkill } from "@/lib/domain/skills";
import { useProjects } from "./project-provider";
import { confirmMilestone, reopenMilestone } from "@/lib/projects/progress";
import { starterSchema } from "@/lib/domain/starter";
import { StarterFiles } from "./starter-files";
import { SkillCheck } from "./skill-check";
import { SkillReuse } from "./skill-reuse";
import { GuidedBuild } from "./guided-build";
import { MilestoneCheck } from "./milestone-check";
import { multipleChoiceQuestionSchema } from "@/lib/domain/learning";
import { targetedCheckSchema } from "@/lib/domain/passport";
import {isEditingField, revealResult, useResultFocus} from "./result-focus";
import Link from "next/link";
import {recordedMilestoneSkills} from "@/lib/domain/passport";
const modes: { value: TutorMode; label: string }[] = [{value:"hint",label:"Hint"},{value:"explain",label:"Explain"},{value:"debug",label:"Debug"},{value:"review",label:"Review code"},{value:"example",label:"Example"},{value:"solution",label:"Full solution"}];
export function LearningWorkspace({ project, milestone }: { project: SessionProject; milestone: Milestone }) {
  const {saveProject,loadProject,passport} = useProjects();
  const [refresher,setRefresher] = useState(false);
  const [checkSkillId,setCheckSkillId] = useState<string>();
  const checkContainer=useRef<HTMLDivElement>(null);
  const filesContainer=useRef<HTMLDivElement>(null);
  const errorContainer=useRef<HTMLParagraphElement>(null);
  const feedbackContainer=useRef<HTMLParagraphElement>(null);
  const milestoneCheckContainer=useRef<HTMLDivElement>(null);
  const copilotContainer=useRef<HTMLOListElement>(null);
  const criteriaContainer=useRef<HTMLHeadingElement>(null);
  const focusResult=useResultFocus();
  const [filesRequest,setFilesRequest]=useState(0);
  const [filesPath,setFilesPath]=useState<string>();
  useEffect(()=>{
    if(!refresher)return;
    const frame=requestAnimationFrame(()=>{revealResult(checkContainer.current?.querySelector<HTMLSelectElement>("select") ?? null);});
    return()=>cancelAnimationFrame(frame);
  },[refresher]);
  const previouslyPracticed = milestone.skillIds.filter(id => passport.some(record => record.skillId === id && record.status !== "new" && record.evidence.some(item => item.projectId !== project.id && item.kind === "student-work")));
  const [activity,setActivity] = useState<LearningActivity>(()=>project.learning?.[milestone.id]??emptyActivity());
  const [tab,setTab]=useState("learn"), [mode,setMode]=useState<TutorMode>("hint"), [question,setQuestion]=useState("");
  const [busy,setBusy]=useState<string|null>(null), [error,setError]=useState<string|null>(null), [status,setStatus]=useState("");
  const [passportCompletion,setPassportCompletion]=useState<string | null>(null);
  const [confirmReplacement,setConfirmReplacement]=useState(false);
  const guideContainer=useRef<HTMLDivElement>(null);
  const lock=useRef(false);
  const baselineRevision=useRef(project.revision);
  const check=activity.shortQuestion || activity.lesson?.knowledgeCheck || milestone.assessmentPrompt;
  const completed = project.completedMilestoneIds.includes(milestone.id);
  const prerequisitesReady = milestone.prerequisiteIds.every(id => project.completedMilestoneIds.includes(id));
  const criteriaReady = milestone.acceptanceCriteria.every((_,index) => activity.checkedCriteria.includes(index));
  async function changeCompletion() {
    if(lock.current)return;lock.current=true;setBusy("save");setError(null);setStatus("");
    try {
      const latest=await loadProject(project.id);
      if(!latest)throw new Error("This project is no longer in this session.");
      if(latest.revision!==baselineRevision.current)throw new Error("This project changed elsewhere. Keep your unsaved work, then reload before saving.");
      const next=completed?reopenMilestone(latest,milestone.id):confirmMilestone(latest,milestone.id,activity);
      const savedPassport=await saveProject(next);
      baselineRevision.current++;
      setActivity(next.learning?.[milestone.id]??activity);
      if(completed) {setStatus("Milestone reopened");setPassportCompletion(null);}
      else {
        const recorded=recordedMilestoneSkills(savedPassport.filter(skill=>milestone.skillIds.includes(skill.skillId)),project.id,milestone.id,activity.work);
        const message=recorded.length
          ? `Milestone complete. Recorded in your Learning Passport: ${recorded.map(skill=>`${findSkill(skill.skillId)?.name ?? skill.skillId} · ${skill.status}`).join("; ")}.`
          : "Milestone complete. No practical skill evidence was recorded for this submission. Save your code or implementation notes to record skills in your Learning Passport.";
        setStatus(message);setPassportCompletion(message);
      }
      focusResult(feedbackContainer);
    }catch(cause){setError(cause instanceof Error?cause.message:"Couldn’t save completion.");focusResult(errorContainer);}finally{lock.current=false;setBusy(null);}
  }
  async function persist(next:LearningActivity, deferUntilSaved = false) {
    if(!deferUntilSaved)setActivity(next);
    const latest=await loadProject(project.id);
    if(!latest) throw new Error("This project is no longer in this session.");
    if(latest.revision!==baselineRevision.current)throw new Error("This project changed elsewhere. Keep your unsaved work, then reload before saving.");
    await saveProject({...latest,learning:{...latest.learning,[milestone.id]:next}});
    baselineRevision.current++;
    if(deferUntilSaved)setActivity(next);
  }
  async function run(action:LearningRequest["action"], replacementConfirmed = false) {
    if(lock.current)return;
    if(action==="lesson" && !replacementConfirmed && activity.lesson?.guidedSteps.length) {
      setConfirmReplacement(true);
      return;
    }
    setConfirmReplacement(false);
    lock.current=true;setBusy(action);setError(null);setStatus("");
    const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),["starter", "check", "milestone-quiz"].includes(action) ? 130000 : 65000);
    try {
      const response=await fetch("/api/learning",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,projectId:project.id,revision:baselineRevision.current,milestoneId:milestone.id,mode,question,work:activity.work,answer:activity.answer}),signal:controller.signal});
      const body=await response.json();
      if(!response.ok)throw new Error(typeof body.error==="string"?body.error:"Couldn’t get assistance.");
      baselineRevision.current=sessionProjectSchema.parse(body.project).revision;
      let next=activity;
      if(action==="starter")next={...activity,starter:starterSchema.parse(body.result)};
      if(action==="lesson")next={...activity,lesson:lessonSchema.parse(body.result),review:null,reviewedAnswer:"",completedStepIds:[]};
      if(action==="check")next={...activity,review:reviewSchema.parse(body.result),reviewedAnswer:activity.answer};
      if(action==="milestone-quiz")next=activity.checkFormat==="multiple-choice"
        ? {...activity,multipleChoiceQuestion:multipleChoiceQuestionSchema.parse(body.result),multipleChoiceAnswer:null}
        : {...activity,shortQuestion:targetedCheckSchema.parse(body.result).question,answer:"",review:null,reviewedAnswer:""};
      if(action==="tutor") {
        const reply=tutorReplySchema.parse(body.result);
        next={...activity,messages:[...activity.messages,{role:"student" as const,text:`${modes.find(item=>item.value===mode)?.label}: ${question}`},{role:"tutor" as const,text:reply.explanation,code:reply.code,nextStep:reply.nextStep}].slice(-12)};
      }
      await persist(next, action==="lesson");
      if(action==="tutor")setQuestion("");
      setStatus(action==="milestone-quiz"?"Knowledge-check question ready.":action==="check"?"Review saved":action==="lesson"?"Lesson saved":action==="starter"?"Starter saved":"Reply saved");
      if (!isEditingField()) {
        setTab(action==="tutor"?"copilot":action==="check" || action==="milestone-quiz"?"work":"learn");
        if(action==="lesson")focusResult(guideContainer);
        if(action==="tutor")focusResult(copilotContainer,"li:last-child");
        if(action==="starter"){setFilesPath(undefined);setFilesRequest(value=>value+1);}
        if(action==="check")focusResult(milestoneCheckContainer,"[data-check-result]");
        if(action==="milestone-quiz")focusResult(milestoneCheckContainer,"[data-check-question]");
      }
    }catch(cause){const message=controller.signal.aborted?"The request timed out. Your work is still here.":cause instanceof Error?cause.message:"Couldn’t save your work.";setError(message);focusResult(errorContainer);}
    finally{clearTimeout(timer);lock.current=false;setBusy(null);}
  }
  async function saveWork(attemptOnly = false){
    if(attemptOnly && !activity.work.trim()) {
      setError(null);setStatus("There’s nothing to save yet. Add your code or notes first.");focusResult(feedbackContainer);return;
    }
    if(lock.current)return;lock.current=true;setBusy("save");setError(null);setStatus("");
    try{await persist(activity);setStatus("Work saved");focusResult(feedbackContainer);}catch(cause){setError(cause instanceof Error?cause.message:"Couldn’t save your work.");focusResult(errorContainer);}finally{lock.current=false;setBusy(null);}
  }
  async function saveGuidedProgress(next: LearningActivity, message: string): Promise<boolean> {
    if (lock.current) return false;
    lock.current=true; setBusy("save"); setError(null); setStatus("");
    try {
      const latest=await loadProject(project.id);
      if(!latest || latest.revision!==baselineRevision.current) throw new Error("This project changed elsewhere. Keep your unsaved work, then reload before saving.");
      const savedActivity=latest.learning?.[milestone.id] ?? emptyActivity();
      await saveProject({...latest,learning:{...latest.learning,[milestone.id]:{...savedActivity,setupConfirmed:next.setupConfirmed,completedStepIds:next.completedStepIds}}});
      baselineRevision.current++; setActivity(next);
      setStatus(message + (next.work!==savedActivity.work || next.answer!==savedActivity.answer ? " Your attempt is still unsaved." : ""));
      return true;
    }
    catch (cause) {setActivity(activity); setError(cause instanceof Error ? cause.message : "Couldn’t save your place.");focusResult(errorContainer); return false;}
    finally {lock.current=false; setBusy(null);}
  }
  async function saveCheckChoice(update: Partial<Pick<LearningActivity,"checkFormat" | "multipleChoiceAnswer">>, message: string) {
    if(lock.current)return;
    lock.current=true;setBusy("save");setError(null);setStatus("");
    try {
      const latest=await loadProject(project.id);
      if(!latest || latest.revision!==baselineRevision.current)throw new Error("This project changed elsewhere. Keep your unsaved work, then reload before saving.");
      const saved=latest.learning?.[milestone.id] ?? emptyActivity();
      await saveProject({...latest,learning:{...latest.learning,[milestone.id]:{...saved,...update}}});
      baselineRevision.current++;setActivity({...activity,...update});setStatus(message);
      focusResult(milestoneCheckContainer, update.multipleChoiceAnswer !== undefined ? "[data-check-result]" : "[data-check-format]");
    }catch(cause){setError(cause instanceof Error?cause.message:"Couldn’t save your check choice.");focusResult(errorContainer);}
    finally{lock.current=false;setBusy(null);}
  }
  function openFiles(path?: string) {
    setFilesPath(path);
    setFilesRequest(prior => prior + 1);
  }
  const firstMilestone=project.roadmap.milestones[0];
  const starter=activity.starter ?? project.learning?.[firstMilestone.id]?.starter;
  const setupReady=activity.setupConfirmed || project.learning?.[firstMilestone.id]?.setupConfirmed === true || project.completedMilestoneIds.includes(firstMilestone.id);
  const conceptNotes = activity.lesson && <details className="concept-notes"><summary>Concept notes and example</summary><div className="lesson-content">{activity.lesson.sections.map((section,index)=><section key={index}><h3>{section.title}</h3><p>{section.explanation}</p></section>)}<h3>Worked example <span className="optional-label">{activity.lesson.example.language}</span></h3><pre className="code-block"><code>{activity.lesson.example.code}</code></pre><p>{activity.lesson.example.explanation}</p></div></details>;
  return <div className="learning-workspace">
    <div className="learning-tabs" role="tablist" aria-label="Milestone workspace">{["learn","work","copilot"].map(item=><button type="button" role="tab" id={`tab-${item}`} aria-selected={tab===item} aria-controls={`panel-${item}`} tabIndex={tab===item?0:-1} key={item} onClick={()=>{setTab(item);if(item!=="work")setRefresher(false);}} onKeyDown={event=>{if(["ArrowLeft","ArrowRight","Home","End"].includes(event.key)){event.preventDefault();const tabs=["learn","work","copilot"],index=event.key==="Home"?0:event.key==="End"?2:(tabs.indexOf(item)+(event.key==="ArrowRight"?1:2))%3;setTab(tabs[index]);if(tabs[index]!=="work")setRefresher(false);document.getElementById(`tab-${tabs[index]}`)?.focus();}}}>{item==="learn"?"Build":item==="work"?"Your work":"Copilot"}</button>)}</div>
    {error&&<p ref={errorContainer} tabIndex={-1} role="alert" className="notice notice-error">{error} You can retry or save your work.</p>}
    <p ref={feedbackContainer} tabIndex={-1} role="status" className="workspace-feedback">{busy?busy==="save"?"Saving…":busy==="starter"?"Creating starter files… Up to two minutes.":busy==="check"?"Reviewing understanding… Up to two minutes.":busy==="milestone-quiz"?"Creating knowledge-check question… Up to two minutes.":busy==="tutor"?"Asking Copilot…":"Gemini is responding…":status}{!busy && passportCompletion === status && <>{" "}<Link href="/passport" className="text-link">View Learning Passport →</Link></>}</p>
    {confirmReplacement && <section className="notice" role="dialog" aria-labelledby="replace-guidance-title" aria-describedby="replace-guidance-description">
      <h3 id="replace-guidance-title">Replace the current steps?</h3>
      <p id="replace-guidance-description">Gemini will write a new lesson. After it is saved, your current step instructions will be replaced and the step checkmarks will be cleared. Your saved work and milestone completion stay saved.</p>
      <div className="workspace-actions"><button autoFocus className="button button-secondary" onClick={() => {setConfirmReplacement(false);setStatus("Your current steps and checkmarks are unchanged.");focusResult(feedbackContainer);}}>Keep current steps</button><button className="button button-primary" disabled={!!busy} onClick={() => void run("lesson",true)}>Replace the current steps</button></div>
    </section>}
    <section role="tabpanel" id="panel-learn" aria-labelledby="tab-learn" hidden={tab!=="learn"}>
      <SkillReuse projectId={project.id} skillIds={milestone.skillIds} lessonBusy={!!busy || confirmReplacement} onPractice={id => {setRefresher(true);setCheckSkillId(id);setTab("work");}} />
      {previouslyPracticed.length > 0 && conceptNotes}
      <div ref={guideContainer} tabIndex={-1} aria-label="Building steps"><GuidedBuild lesson={activity.lesson} starter={starter} setupReady={setupReady} localSetupConfirmed={activity.setupConfirmed || project.learning?.[firstMilestone.id]?.setupConfirmed === true} completedStepIds={activity.completedStepIds} busy={!!busy} prerequisitesReady={prerequisitesReady} milestoneCompleted={completed}
        confirmSetup={async () => {if(await saveGuidedProgress({...activity,setupConfirmed:true},"Your local setup confirmation is saved. SkillSprint did not run your project."))focusResult(feedbackContainer);}}
        confirmStep={id => {
          const steps=activity.lesson?.guidedSteps ?? [];
          const index=steps.findIndex(step => step.id===id), nextStep=steps[index+1];
          const message=nextStep
            ? `Step ${index+1} confirmed: ${steps[index].title}. Now on step ${index+2} of ${steps.length}: ${nextStep.title}.`
            : `Step ${index+1} confirmed: ${steps[index].title}. All building steps are confirmed. Next, open completion criteria.`;
          return saveGuidedProgress({...activity,completedStepIds:[...activity.completedStepIds,id]},message);
        }}
        generate={() => run("lesson")} openFiles={openFiles} openWork={() => {setTab("work");setStatus("Completion criteria opened. Check each one, then mark the milestone complete.");focusResult(criteriaContainer);}}
        help={(nextMode, nextQuestion) => {setMode(nextMode);setQuestion(nextQuestion.slice(0,2000));setTab("copilot");setStatus("Copilot opened. Your question is ready to send.");requestAnimationFrame(() => document.getElementById("copilot-question")?.focus());}}
        work={activity.work} changeWork={work => {setActivity({...activity,work});setStatus("Unsaved work");}} saveWork={() => saveWork(true)} /></div>
      <div ref={filesContainer}><StarterFiles starter={starter} busy={!!busy} generate={() => run("starter")} openRequest={filesRequest} requestedPath={filesPath} setupMilestone={firstMilestone.id !== milestone.id ? firstMilestone.title : undefined} /></div>
      <div className="skill-tags">{milestone.skillIds.map(id=><span className={`skill-state skill-${passport.find(record=>record.skillId===id)?.status??"new"}`} key={id}>{findSkill(id)?.name??id} · {passport.find(record=>record.skillId===id)?.status??"new"}</span>)}</div>
      {previouslyPracticed.length === 0 && conceptNotes}
      {milestone.resources.length>0&&<details className="learning-references"><summary>Official references</summary><ul className="resource-list">{milestone.resources.map(resource=><li key={resource.url}><a href={resource.url} target="_blank" rel="noopener noreferrer">{resource.title}<span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul></details>}
    </section>
    <section role="tabpanel" id="panel-work" aria-labelledby="tab-work" hidden={tab!=="work"}>
      <h3>Tasks</h3><ol className="task-list">{milestone.tasks.map((task,index)=><li key={index}><span>{String(index+1).padStart(2,"0")}</span><p>{task}</p></li>)}</ol>
      <div className="form-field"><label htmlFor="student-work">Your code or implementation notes</label><textarea className="code-input" id="student-work" rows={7} maxLength={12000} disabled={!!busy} value={activity.work} onChange={event=>{setActivity({...activity,work:event.target.value});setStatus("Unsaved work");}} placeholder="Paste a relevant snippet or explain what you built and how you tested it."/></div>
      <h3 ref={criteriaContainer} tabIndex={-1}>Completion criteria</h3><div className="criterion-checks">{milestone.acceptanceCriteria.map((criterion,index)=><label key={index}><input type="checkbox" disabled={!!busy || completed} checked={activity.checkedCriteria.includes(index)} onChange={event=>{setActivity({...activity,checkedCriteria:event.target.checked?[...activity.checkedCriteria,index]:activity.checkedCriteria.filter(value=>value!==index)});setStatus("Unsaved criteria");}}/><span>{criterion}</span></label>)}</div>
      <button className="button button-secondary" disabled={!!busy} onClick={() => saveWork()}>Save work</button>
      <div ref={milestoneCheckContainer}><MilestoneCheck activity={activity} question={check} busy={!!busy}
        chooseFormat={format => void saveCheckChoice({checkFormat:format},`${format==="multiple-choice"?"Multiple choice":"Short answer"} selected and saved. No question generated.`)}
        createQuestion={() => void run("milestone-quiz")}
        checkAnswer={option => void saveCheckChoice({multipleChoiceAnswer:option},"Answer checked and saved. Passport status is unchanged.")}
        changeAnswer={answer => {setActivity({...activity,answer,review:null,reviewedAnswer:""});setStatus("Unsaved answer");}}
        reviewAnswer={() => void run("check")} /></div>
      <p className="quiet-note">Criteria are your confirmation. AI reviews understanding; it doesn’t execute your code.</p>
      <div ref={checkContainer}><SkillCheck projectId={project.id} milestoneId={milestone.id} skillIds={milestone.skillIds} expanded={refresher} preferredSkillId={checkSkillId} showResult={() => {if(!isEditingField())setTab("work");}} /></div>
      <div className="completion-action"><button className="button button-primary" disabled={!!busy || (!completed && (!criteriaReady || !prerequisitesReady))} onClick={changeCompletion}>{completed?"Reopen milestone":"Mark milestone complete"}</button><p className="quiet-note">{completed?"Completed · student-confirmed":!prerequisitesReady?"Complete the prerequisites first.":!criteriaReady?"Confirm each criterion to complete this milestone.":"Student-confirmed progress; the knowledge check is tracked separately."}</p></div>
    </section>
    <section role="tabpanel" id="panel-copilot" aria-labelledby="tab-copilot" hidden={tab!=="copilot"}>
      <div className="copilot-context">Helping with <strong>{milestone.title}</strong></div>
      {activity.messages.length>0&&<ol ref={copilotContainer} className="tutor-conversation" aria-label="Copilot conversation">{activity.messages.map((message,index)=><li key={index} tabIndex={-1} className={`message-${message.role}`}><span className="eyebrow">{message.role==="student"?"YOU":"COPILOT"}</span><p>{message.text}</p>{message.code && <pre className="code-block"><code>{message.code}</code></pre>}{message.nextStep && <p>{message.nextStep}</p>}</li>)}</ol>}
      <form onSubmit={event=>{event.preventDefault();run("tutor");}}><div className="form-field"><label htmlFor="help-mode">Help with</label><select id="help-mode" disabled={!!busy} value={mode} onChange={event=>setMode(event.target.value as TutorMode)}>{modes.map(item=><option value={item.value} key={item.value}>{item.label}</option>)}</select></div><div className="form-field"><label htmlFor="copilot-question">Your question</label><textarea id="copilot-question" rows={3} required maxLength={2000} disabled={!!busy} value={question} onChange={event=>setQuestion(event.target.value)} placeholder="What have you tried, and where are you stuck?"/></div><p className="quiet-note" role="status">{question.trim() ? mode==="solution" ? "Press Request full solution to send this." : "Press Ask copilot to send this." : "Write a question, then use the button below to send it."}</p><p className="quiet-note">Includes your current work and conversation when sent to Gemini; leave out secrets.</p><button className="button button-primary" disabled={!!busy||!question.trim()}>{mode==="solution"?"Request full solution":"Ask copilot"}</button></form>
    </section>
  </div>;
}
