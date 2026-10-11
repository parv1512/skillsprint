import {describe, expect, it, vi} from "vitest";
import {emptyActivity, guidedLessonSchema, lessonSchema, learningRequestSchema} from "../src/lib/domain/learning";
import {sessionProjectSchema} from "../src/lib/projects/store";
import {applyStudentSave} from "../src/lib/server/project-policy";
import {buildLearningPrompt} from "../src/lib/ai/learning";
import {formatSource, formatStarter} from "../src/lib/projects/format-source";
import {starterSchema} from "../src/lib/domain/starter";
import {handleWorkspace} from "../src/lib/server/workspace-handler";
import type {WorkspaceRepository} from "../src/lib/db/repository";

const step = {id:"about-section",title:"Add an About section",filePath:"index.html",concept:"A section groups related content.",instruction:"Inside main, add a section with an h2 and a paragraph.",exampleCode:"",expectedResult:"Your About heading and paragraph appear.",verification:"Open index.html and check the About content.",reflection:"Why does the heading belong inside this section?"};
const legacyLesson = {sections:[{title:"HTML",explanation:"Use meaningful elements."}],example:{language:"html",code:"<main></main>",explanation:"Main contains page content."},knowledgeCheck:"Why use main?"};
const guidedLesson = {...legacyLesson,guidedSteps:[step,{...step,id:"project-card",title:"Add a project card"}]};
function project() {return sessionProjectSchema.parse({id:"00000000-0000-4000-8000-000000000004",createdAt:"2026-10-10T01:00:00Z",intake:{idea:"Build a small portfolio",experience:"beginner",availableHours:6,existingKnowledge:"Basic HTML"},roadmap:{title:"Portfolio",summary:"Show projects",scopeNotes:"",milestones:[{id:"one",title:"Page structure",outcome:"Display content",skillIds:["html.semantics"],prerequisiteIds:[],tasks:["Add a section"],resources:[],estimatedHours:2,acceptanceCriteria:["Content appears"],assessmentPrompt:"Explain main"}]},completedMilestoneIds:[],learning:{one:{...emptyActivity(),lesson:guidedLesson}}});}

describe("guided build safety and compatibility",()=>{
  it("reads old lessons but requires complete unique steps for new guided generation",()=>{
    expect(lessonSchema.parse(legacyLesson).guidedSteps).toEqual([]);
    expect(guidedLessonSchema.safeParse(legacyLesson).success).toBe(false);
    expect(guidedLessonSchema.safeParse(guidedLesson).success).toBe(true);
    expect(guidedLessonSchema.safeParse({...guidedLesson,guidedSteps:[step,step]}).success).toBe(false);
    expect(guidedLessonSchema.safeParse({...guidedLesson,guidedSteps:[{...step,filePath:"../secret.env"},guidedLesson.guidedSteps[1]]}).success).toBe(false);
  });
  it("saves setup/step confirmations without completing milestones or inventing reviews",()=>{
    const current=project(), activity={...current.learning!.one,setupConfirmed:true,completedStepIds:[step.id]};
    const saved=applyStudentSave(current,{...current,learning:{one:activity}});
    expect(saved.learning!.one.setupConfirmed).toBe(true);
    expect(saved.learning!.one.completedStepIds).toEqual([step.id]);
    expect(saved.completedMilestoneIds).toEqual([]);
    expect(saved.learning!.one.completionConfirmedAt).toBeNull();
    expect(saved.learning!.one.review).toBeNull();
  });
  it("rejects skipped/duplicate confirmation and client-replaced guided plans",()=>{
    const current=project();
    expect(sessionProjectSchema.safeParse({...current,learning:{one:{...current.learning!.one,completedStepIds:["project-card"]}}}).success).toBe(false);
    expect(sessionProjectSchema.safeParse({...current,learning:{one:{...current.learning!.one,completedStepIds:[step.id,step.id]}}}).success).toBe(false);
    expect(()=>applyStudentSave(current,{...current,learning:{one:{...current.learning!.one,lesson:{...current.learning!.one.lesson!,guidedSteps:[{...step,id:"forged"}]},completedStepIds:["forged"]}}})).toThrow();
  });
  it("grounds guidance in actual files and leaves the taught feature to the student",()=>{
    const current=project();
    const input=learningRequestSchema.parse({action:"lesson",intake:current.intake,roadmap:current.roadmap,milestoneId:"one"});
    const prompt=buildLearningPrompt(input);
    expect(prompt).toContain("Use actual starter file paths/content");
    expect(prompt).toContain("2-8 small ordered building steps");
    expect(prompt).toContain("external editor");
    expect(prompt).toContain("build on the student-confirmed work in previousMilestones");
    expect(prompt).toContain("style the existing articles from the HTML milestone");
    expect(prompt).toContain("still assign their practical project work");
    const starterPrompt=buildLearningPrompt({...input,action:"starter"});
    expect(starterPrompt).toContain("never minify");
    expect(starterPrompt).toContain("do not already implement Flexbox/Grid/media queries");
  });
  it.each([false, true])("uses only stored, earlier confirmed work for lessons (milestone complete: %s)",async milestoneConfirmed=>{
    const base=project(), first=base.roadmap.milestones[0];
    const saved=sessionProjectSchema.parse({...base,roadmap:{...base.roadmap,milestones:[first,{...first,id:"two",title:"Style existing sections",skillIds:["css.layout"],prerequisiteIds:["one"]},{...first,id:"three",prerequisiteIds:["two"]}]},completedMilestoneIds:milestoneConfirmed?["one"]:[],learning:{one:{...base.learning!.one,completedStepIds:[step.id]},two:{...base.learning!.one,completedStepIds:[step.id]},three:{...base.learning!.one,completedStepIds:[step.id]}}});
    const generate=vi.fn().mockResolvedValue(guidedLesson);
    const repo={loadProject:vi.fn().mockResolvedValue(saved),passport:vi.fn().mockResolvedValue([]),saveGenerated:vi.fn().mockResolvedValue(saved)};
    const dependencies={identity:async()=>"test-student",repository:async()=>repo as unknown as WorkspaceRepository,generate};
    const request=(extra={})=>new Request("http://localhost:3000/api/learning",{method:"POST",headers:{origin:"http://localhost:3000","content-type":"application/json"},body:JSON.stringify({projectId:saved.id,milestoneId:"two",revision:saved.revision,action:"lesson",...extra})});
    expect((await handleWorkspace(request({previousMilestones:[]}),"learning",dependencies)).status).toBe(400);
    expect(generate).not.toHaveBeenCalled();
    expect((await handleWorkspace(request(),"learning",dependencies)).status).toBe(200);
    const prior=generate.mock.calls[0][0].previousMilestones;
    expect(prior).toEqual([{milestoneId:"one",title:first.title,skillIds:first.skillIds,milestoneConfirmed,tasks:milestoneConfirmed?first.tasks:[],confirmedSteps:[{title:step.title,filePath:step.filePath,instruction:step.instruction,expectedResult:step.expectedResult}]}]);
    expect(saved.completedMilestoneIds).toEqual(milestoneConfirmed?["one"]:[]);
  });
});

describe("readable starter files",()=>{
  it("formats one-line CSS, JS/TS, HTML, and JSON without altering string data",async()=>{
    const css=await formatSource("style.css","nav{display:flex;gap:1rem;}@media(max-width:600px){nav{flex-direction:column;}}");
    expect(css.content).toContain("\n  display: flex;\n");
    expect(css.content).toContain("flex-direction: column;");
    expect((await formatSource("index.html","<!doctype html><html><head><title>Portfolio</title></head><body><main><h1>My work</h1></main></body></html>")).content.split("\n").length).toBeGreaterThan(5);
    expect((await formatSource("App.tsx","export function App(){return <main><h1>Portfolio</h1><p>My work</p></main>;}")).content).toContain("\n");
    const data={message:"literal \\n stays literal",value:"<script>alert(1)</script>"};
    const json=await formatSource("package.json",JSON.stringify(data));
    expect(JSON.parse(json.content)).toEqual(data);
  });
  it("preserves invalid or unsupported source rather than guessing its structure",async()=>{
    expect(await formatSource("broken.js","function {")).toEqual({content:"function {",preserved:true});
    const python="def hello():\n    print('hello')\n";
    expect(await formatSource("main.py",python)).toEqual({content:python,preserved:true});
  });
  it("keeps formatted exports and the source object separate",async()=>{
    const starter=starterSchema.parse({summary:"Minimal portfolio",files:[{path:"style.css",purpose:"Style the page",content:"body{margin:0;color:black;}"}],setupSteps:["Open index.html"],firstTask:"Add an About section"});
    const readable=await formatStarter(starter);
    expect(readable.files[0].content).toContain("\n");
    expect(starter.files[0].content).toBe("body{margin:0;color:black;}");
    expect(readable.files[0].path).toBe(starter.files[0].path);
  });
});
