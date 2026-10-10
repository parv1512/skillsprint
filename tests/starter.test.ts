import { describe, expect, it, vi } from "vitest";
import { mkdir, writeFile } from "node:fs/promises";
import { starterSchema, starterPathSchema } from "../src/lib/domain/starter";
import { learningRequestSchema, emptyActivity } from "../src/lib/domain/learning";
import { generateLearning, buildLearningPrompt } from "../src/lib/ai/learning";
import { createStarterArchive } from "../src/lib/projects/starter-archive";
import { createSessionProjectStore } from "../src/lib/projects/session-store";
import { sessionProjectSchema } from "../src/lib/projects/store";

const starter={summary:"Start with a small TypeScript screen.",files:[{path:"src/main.ts",purpose:"Entry point",content:"console.log('Hello, learner');\n"},{path:"README.md",purpose:"Setup and first task",content:"Create the project files and add your first assignment.\n"}],setupSteps:["Open this folder in your editor."],firstTask:"Define an Assignment interface."};
const milestone={id:"one",title:"Set up",outcome:"Prepare a project",skillIds:["typescript.types"],prerequisiteIds:[],tasks:["Define an interface"],resources:[],estimatedHours:2,acceptanceCriteria:["Interface exists"],assessmentPrompt:"Explain the types"};
const project=sessionProjectSchema.parse({id:"00000000-0000-4000-8000-000000000001",createdAt:"2026-10-10T01:00:00Z",intake:{idea:"Build a study planner",experience:"beginner",availableHours:10,existingKnowledge:"HTML and CSS",preferredStack:"TypeScript"},roadmap:{title:"Planner",summary:"Build a planner",milestones:[milestone,{...milestone,id:"two",prerequisiteIds:["one"]}]},completedMilestoneIds:[]});
const input=learningRequestSchema.parse({action:"starter",intake:project.intake,roadmap:project.roadmap,milestoneId:"one"});

describe("starter projects",()=>{
  it("rejects traversal, absolute paths, hidden files, and Windows device names",()=>{
    for(const path of ["../App.tsx","src/../../outside","/etc/file","C:/file","src\\App.tsx",".env","src/.git/config","CON.txt","src/NUL","src/file."])expect(starterPathSchema.safeParse(path).success).toBe(false);
    expect(starterPathSchema.safeParse("src/components/Assignment.tsx").success).toBe(true);
  });
  it("rejects conflicting file paths and oversized output",()=>{
    expect(starterSchema.safeParse({...starter,files:[starter.files[0],{...starter.files[0],path:"SRC/main.ts"}]}).success).toBe(false);
    expect(starterSchema.safeParse({...starter,files:[{...starter.files[0],path:"src"},starter.files[0]]}).success).toBe(false);
    expect(starterSchema.safeParse({...starter,files:Array.from({length:6},(_,i)=>({...starter.files[0],path:`file${i}.ts`,content:"x".repeat(9000)}))}).success).toBe(false);
  });
  it("generates setup rather than later milestone features and rejects starter requests for later milestones",async()=>{
    expect(buildLearningPrompt(input)).toContain("do not generate a finished project");
    expect(buildLearningPrompt(input)).toContain("firstTask tied to the milestone");
    expect(buildLearningPrompt({...input, action:"tutor", mode:"hint", question:"Where should I define the type?", starter})).toContain("src/main.ts");
    expect(learningRequestSchema.safeParse({...input,milestoneId:"two"}).success).toBe(false);
    const fetcher=vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({candidates:[{finishReason:"STOP",content:{parts:[{text:JSON.stringify(starter)}]}}]})));
    expect(await generateLearning(input,{apiKey:"test-key",model:"gemini-test",fetcher})).toEqual(starter);
  });
  it("keeps starter files after a reload without awarding progress",async()=>{
    let data:string|null=null;
    const storage={getItem:()=>data,setItem:(_key:string,value:string)=>{data=value;}};
    await createSessionProjectStore(storage).saveProject({...project,learning:{one:{...emptyActivity(),starter}}});
    const saved=await createSessionProjectStore(storage).loadProject(project.id);
    expect(saved?.learning?.one.starter).toEqual(starter);
    expect(saved?.completedMilestoneIds).toEqual([]);
  });
  it("creates a ZIP fixture for independent system-reader validation",async()=>{
    await mkdir(".tmp",{recursive:true});
    await writeFile(".tmp/starter-archive.zip",createStarterArchive(starter));
    expect(()=>createStarterArchive({...starter,files:[{...starter.files[0],path:"../outside"}]})).toThrow();
  });
});
