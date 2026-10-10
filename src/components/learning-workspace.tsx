"use client";
import { useRef, useState } from "react";
import type { Milestone } from "@/lib/domain/types";
import { emptyActivity, lessonSchema, reviewSchema, tutorReplySchema, type LearningActivity, type LearningRequest, type TutorMode } from "@/lib/domain/learning";
import type { SessionProject } from "@/lib/projects/store";
import { findSkill } from "@/lib/domain/skills";
import { useProjects } from "./project-provider";
import { confirmMilestone, reopenMilestone } from "@/lib/projects/progress";
import { starterSchema } from "@/lib/domain/starter";
import { StarterFiles } from "./starter-files";
const modes: { value: TutorMode; label: string }[] = [{value:"hint",label:"Hint"},{value:"explain",label:"Explain"},{value:"debug",label:"Debug"},{value:"review",label:"Review code"},{value:"example",label:"Example"},{value:"solution",label:"Full solution"}];
export function LearningWorkspace({ project, milestone }: { project: SessionProject; milestone: Milestone }) {
  const {saveProject,loadProject} = useProjects();
  const [activity,setActivity] = useState<LearningActivity>(()=>project.learning?.[milestone.id]??emptyActivity());
  const [tab,setTab]=useState("learn"), [mode,setMode]=useState<TutorMode>("hint"), [question,setQuestion]=useState("");
  const [busy,setBusy]=useState<string|null>(null), [error,setError]=useState<string|null>(null), [status,setStatus]=useState("");
  const lock=useRef(false);
  const check=activity.lesson?.knowledgeCheck??milestone.assessmentPrompt;
  const completed = project.completedMilestoneIds.includes(milestone.id);
  const prerequisitesReady = milestone.prerequisiteIds.every(id => project.completedMilestoneIds.includes(id));
  const criteriaReady = milestone.acceptanceCriteria.every((_,index) => activity.checkedCriteria.includes(index));
  async function changeCompletion() {
    if(lock.current)return;lock.current=true;setBusy("save");setError(null);setStatus("");
    try {
      const latest=await loadProject(project.id);
      if(!latest)throw new Error("This project is no longer in this session.");
      const next=completed?reopenMilestone(latest,milestone.id):confirmMilestone(latest,milestone.id,activity);
      await saveProject(next);
      setActivity(next.learning?.[milestone.id]??activity);
      setStatus(completed?"Milestone reopened":"Completion saved · student-confirmed");
    }catch(cause){setError(cause instanceof Error?cause.message:"Couldn’t save completion.");}finally{lock.current=false;setBusy(null);}
  }
  async function persist(next:LearningActivity) {
    setActivity(next);
    const latest=await loadProject(project.id);
    if(!latest) throw new Error("This project is no longer in this session.");
    await saveProject({...latest,learning:{...latest.learning,[milestone.id]:next}});
  }
  async function run(action:LearningRequest["action"]) {
    if(lock.current)return;
    lock.current=true;setBusy(action);setError(null);setStatus("");
    const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),action === "starter" ? 130000 : 65000);
    try {
      const {learningGoals:_legacy,...intake}=project.intake;
      const starter = milestone.id === project.roadmap.milestones[0]?.id ? activity.starter : project.learning?.[project.roadmap.milestones[0]?.id]?.starter;
      const response=await fetch("/api/learning",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,intake,roadmap:project.roadmap,milestoneId:milestone.id,mode,question,work:activity.work,answer:activity.answer,knowledgeCheck:check,history:activity.messages,starter}),signal:controller.signal});
      const body=await response.json();
      if(!response.ok)throw new Error(typeof body.error==="string"?body.error:"Couldn’t get assistance.");
      let next=activity;
      if(action==="starter")next={...activity,starter:starterSchema.parse(body.result)};
      if(action==="lesson")next={...activity,lesson:lessonSchema.parse(body.result),review:null,reviewedAnswer:""};
      if(action==="check")next={...activity,review:reviewSchema.parse(body.result),reviewedAnswer:activity.answer};
      if(action==="tutor") {
        const reply=tutorReplySchema.parse(body.result);
        next={...activity,messages:[...activity.messages,{role:"student" as const,text:`${modes.find(item=>item.value===mode)?.label}: ${question}`},{role:"tutor" as const,text:reply.explanation,code:reply.code,nextStep:reply.nextStep}].slice(-12)};
      }
      await persist(next);
      if(action==="tutor")setQuestion("");
      setStatus(action==="check"?"Review saved":action==="lesson"?"Lesson saved":action==="starter"?"Starter saved":"Reply saved");
    }catch(cause){setError(controller.signal.aborted?"The request timed out. Your work is still here.":cause instanceof Error?cause.message:"Couldn’t save your work.");}
    finally{clearTimeout(timer);lock.current=false;setBusy(null);}
  }
  async function saveWork(){
    if(lock.current)return;lock.current=true;setBusy("save");setError(null);setStatus("");
    try{await persist(activity);setStatus("Work saved");}catch(cause){setError(cause instanceof Error?cause.message:"Couldn’t save your work.");}finally{lock.current=false;setBusy(null);}
  }
  return <div className="learning-workspace">
    <div className="learning-tabs" role="tablist" aria-label="Milestone workspace">{["learn","work","copilot"].map(item=><button type="button" role="tab" id={`tab-${item}`} aria-selected={tab===item} aria-controls={`panel-${item}`} tabIndex={tab===item?0:-1} key={item} onClick={()=>setTab(item)} onKeyDown={event=>{if(["ArrowLeft","ArrowRight","Home","End"].includes(event.key)){event.preventDefault();const tabs=["learn","work","copilot"],index=event.key==="Home"?0:event.key==="End"?2:(tabs.indexOf(item)+(event.key==="ArrowRight"?1:2))%3;setTab(tabs[index]);document.getElementById(`tab-${tabs[index]}`)?.focus();}}}>{item==="learn"?"Learn":item==="work"?"Your work":"Copilot"}</button>)}</div>
    {error&&<p role="alert" className="notice notice-error">{error} You can retry or save your work.</p>}
    <p role="status" className="workspace-feedback">{busy?busy==="save"?"Saving…":busy==="starter"?"Creating starter files… Up to two minutes.":"Gemini is responding…":status}</p>
    <section role="tabpanel" id="panel-learn" aria-labelledby="tab-learn" hidden={tab!=="learn"}>
      {project.roadmap.milestones[0]?.id === milestone.id && <StarterFiles starter={activity.starter} busy={!!busy} generate={() => run("starter")} />}
      <div className="skill-tags">{milestone.skillIds.map(id=><span className="skill-state skill-new" key={id}>{findSkill(id)?.name??id}</span>)}</div>
      {!activity.lesson?<div className="lesson-empty"><p>A short lesson and worked example for this milestone.</p><button className="button button-primary" disabled={!!busy} onClick={()=>run("lesson")}>Create lesson</button></div>:<div className="lesson-content">{activity.lesson.sections.map((section,index)=><section key={index}><h3>{section.title}</h3><p>{section.explanation}</p></section>)}<h3>Worked example <span className="optional-label">{activity.lesson.example.language}</span></h3><pre className="code-block"><code>{activity.lesson.example.code}</code></pre><p>{activity.lesson.example.explanation}</p><button className="button button-secondary" onClick={()=>setTab("work")}>Try the tasks →</button></div>}
      {milestone.resources.length>0&&<details className="learning-references"><summary>Official references</summary><ul className="resource-list">{milestone.resources.map(resource=><li key={resource.url}><a href={resource.url} target="_blank" rel="noopener noreferrer">{resource.title}<span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul></details>}
    </section>
    <section role="tabpanel" id="panel-work" aria-labelledby="tab-work" hidden={tab!=="work"}>
      <h3>Tasks</h3><ol className="task-list">{milestone.tasks.map((task,index)=><li key={index}><span>{String(index+1).padStart(2,"0")}</span><p>{task}</p></li>)}</ol>
      <div className="form-field"><label htmlFor="student-work">Your code or implementation notes</label><textarea className="code-input" id="student-work" rows={7} maxLength={12000} disabled={!!busy} value={activity.work} onChange={event=>{setActivity({...activity,work:event.target.value});setStatus("Unsaved work");}} placeholder="Paste a relevant snippet or explain what you built and how you tested it."/></div>
      <h3>Completion criteria</h3><div className="criterion-checks">{milestone.acceptanceCriteria.map((criterion,index)=><label key={index}><input type="checkbox" disabled={!!busy || completed} checked={activity.checkedCriteria.includes(index)} onChange={event=>{setActivity({...activity,checkedCriteria:event.target.checked?[...activity.checkedCriteria,index]:activity.checkedCriteria.filter(value=>value!==index)});setStatus("Unsaved criteria");}}/><span>{criterion}</span></label>)}</div>
      <div className="form-field"><label htmlFor="check-answer">Knowledge check</label><p>{check}</p><textarea id="check-answer" rows={4} maxLength={4000} disabled={!!busy} value={activity.answer} onChange={event=>{setActivity({...activity,answer:event.target.value,review:null,reviewedAnswer:""});setStatus("Unsaved answer");}} placeholder="Explain in your own words."/></div>
      <div className="workspace-actions"><button className="button button-secondary" disabled={!!busy} onClick={saveWork}>Save work</button><button className="button button-primary" disabled={!!busy||!activity.answer.trim()} onClick={()=>run("check")}>Check understanding</button></div>
      {activity.review&&<div className="notice"><strong>{activity.review.passed?"Understanding demonstrated":"Keep practicing"} · AI review</strong><p>{activity.review.feedback}</p><p>{activity.review.nextStep}</p></div>}
      <p className="quiet-note">Criteria are your confirmation. AI reviews understanding; it doesn’t execute your code.</p>
      <div className="completion-action"><button className="button button-primary" disabled={!!busy || (!completed && (!criteriaReady || !prerequisitesReady))} onClick={changeCompletion}>{completed?"Reopen milestone":"Mark milestone complete"}</button><p className="quiet-note">{completed?"Completed · student-confirmed":!prerequisitesReady?"Complete the prerequisites first.":!criteriaReady?"Confirm each criterion to complete this milestone.":"Student-confirmed progress; the knowledge check is tracked separately."}</p></div>
    </section>
    <section role="tabpanel" id="panel-copilot" aria-labelledby="tab-copilot" hidden={tab!=="copilot"}>
      <div className="copilot-context">Helping with <strong>{milestone.title}</strong></div>
      {activity.messages.length>0&&<ol className="tutor-conversation" aria-label="Copilot conversation">{activity.messages.map((message,index)=><li key={index} className={`message-${message.role}`}><span className="eyebrow">{message.role==="student"?"YOU":"COPILOT"}</span><p>{message.text}</p>{message.code && <pre className="code-block"><code>{message.code}</code></pre>}{message.nextStep && <p>{message.nextStep}</p>}</li>)}</ol>}
      <form onSubmit={event=>{event.preventDefault();run("tutor");}}><div className="form-field"><label htmlFor="help-mode">Help with</label><select id="help-mode" disabled={!!busy} value={mode} onChange={event=>setMode(event.target.value as TutorMode)}>{modes.map(item=><option value={item.value} key={item.value}>{item.label}</option>)}</select></div><div className="form-field"><label htmlFor="copilot-question">Your question</label><textarea id="copilot-question" rows={3} required maxLength={2000} disabled={!!busy} value={question} onChange={event=>setQuestion(event.target.value)} placeholder="What have you tried, and where are you stuck?"/></div><p className="quiet-note">Includes your current work and conversation. Sent to Gemini; leave out secrets.</p><button className="button button-primary" disabled={!!busy||!question.trim()}>{mode==="solution"?"Request full solution":"Ask copilot"}</button></form>
    </section>
  </div>;
}
