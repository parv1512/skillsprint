import { describe, expect, it, vi } from "vitest";
import { buildLearningPrompt, generateLearning } from "../src/lib/ai/learning";
import { learningRequestSchema, emptyActivity, lessonSchema } from "../src/lib/domain/learning";
import { handleLearningRequest } from "../src/lib/server/learning-handler";
import { confirmMilestone, reopenMilestone } from "../src/lib/projects/progress";
import { sessionProjectSchema } from "../src/lib/projects/store";
const intake={idea:"Build a study planner",experience:"beginner" as const,availableHours:12,existingKnowledge:"HTML and CSS",preferredStack:"React and TypeScript"};
const first={id:"one",title:"React state",outcome:"Add a task",skillIds:["react.state"],prerequisiteIds:[],tasks:["Add a task"],resources:[],estimatedHours:2,acceptanceCriteria:["Task appears"],assessmentPrompt:"Why use state instead of a local variable?"};
const roadmap={title:"Planner",summary:"Build a planner",scopeNotes:"",milestones:[first,{...first,id:"two",prerequisiteIds:["one"]}]};
const input=learningRequestSchema.parse({action:"tutor",intake,roadmap,milestoneId:"one",mode:"hint",question:"Tasks vanish after adding. Help?"});
const reply={explanation:"Consider how React knows when to render.",code:"",nextStep:"Try storing tasks in state."};
const lesson={sections:[{title:"State",explanation:"State preserves data between renders."}],example:{language:"tsx",code:"const [tasks, setTasks] = useState<string[]>([]);",explanation:"The setter triggers a render."},knowledgeCheck:"Why doesn't assigning a local variable trigger a render?",guidedSteps:[{id:"create-state",title:"Create task state",filePath:"src/App.tsx",concept:"State preserves tasks between renders.",instruction:"Add task state inside App, before return.",exampleCode:"const [count, setCount] = useState(0);",expectedResult:"An empty task list renders.",verification:"Open the app and confirm the empty list.",reflection:"Why use state?"},{id:"append-task",title:"Append a task",filePath:"src/App.tsx",concept:"Immutable updates trigger rendering.",instruction:"Use the setter to append your new task.",exampleCode:"",expectedResult:"The added task appears.",verification:"Add two tasks; check both remain visible.",reflection:"Why create a new array?"}]};
const response=(value:unknown,finishReason="STOP")=>new Response(JSON.stringify({candidates:[{finishReason,content:{parts:[{text:JSON.stringify(value)}]}}]}));
const options=(fetcher:typeof fetch)=>({apiKey:"test-key",model:"gemini-test",fetcher});
const project=()=>sessionProjectSchema.parse({id:"00000000-0000-4000-8000-000000000001",createdAt:"2026-10-10T01:00:00Z",intake,roadmap,completedMilestoneIds:[]});
describe("learning assistance",()=>{
 it("uses low reasoning for help and checks, with default reasoning for lessons and full solutions",async()=>{
  const fetcher=vi.fn<typeof fetch>().mockImplementation(async()=>response(reply));
  await generateLearning(input,{...options(fetcher),model:"gemini-3.8-flash"});
  const config=()=>JSON.parse(fetcher.mock.calls.at(-1)![1]!.body as string).generationConfig;
  expect(config().thinkingConfig).toEqual({thinkingLevel:"low"});
  await generateLearning({...input,mode:"solution"},{...options(fetcher),model:"gemini-3.8-flash"});
  expect(config().thinkingConfig).toBeUndefined();
  fetcher.mockImplementation(async()=>response(lesson));
  await generateLearning({...input,action:"lesson"},{...options(fetcher),model:"gemini-3.8-flash"});
  expect(config().thinkingConfig).toBeUndefined();
  fetcher.mockImplementation(async()=>response({passed:true,feedback:"A substantive explanation",nextStep:"Apply it"}));
  await generateLearning({...input,action:"check",answer:"React schedules a render",knowledgeCheck:"Explain state"},{...options(fetcher),model:"gemini-3.8-flash"});
  expect(config().thinkingConfig).toEqual({thinkingLevel:"low"});
  fetcher.mockImplementation(async()=>response({question:"Why does updating state schedule a render?"}));
  await generateLearning({...input,action:"quiz",skillId:"react.state"},{...options(fetcher),model:"gemini-3.8-flash"});
  expect(config().thinkingConfig).toEqual({thinkingLevel:"low"});
 });
 it("uses hint-first rules, context and prior attempts with a separate solution option",()=>{
  const prompt=buildLearningPrompt({...input,history:[{role:"student",text:"I tried a local array."}]});
  expect(prompt).toContain("Tutor mode: hint");expect(prompt).toContain("Only explicit solution mode");expect(prompt).toContain("I tried a local array");expect(prompt).toContain("no execution tools");expect(prompt).toContain('"existingKnowledge":"HTML and CSS"');
  expect(buildLearningPrompt({...input,mode:"solution"})).toContain("Tutor mode: solution");
 });
 it("validates structured lessons and sends the key only in headers",async()=>{
  const fetcher=vi.fn<typeof fetch>().mockResolvedValue(response(lesson));
  expect(await generateLearning({...input,action:"lesson"},options(fetcher))).toEqual(lesson);
  expect(String(fetcher.mock.calls[0][0])).not.toContain("test-key");
  expect((fetcher.mock.calls[0][1]?.headers as Record<string,string>)["x-goog-api-key"]).toBe("test-key");
 });
 it("omits oversized optional step examples without truncating code or accepting invalid instructions",async()=>{
  const oversized={...lesson,guidedSteps:[{...lesson.guidedSteps[0],exampleCode:Array(12).fill("const example = 1;").join("\n")},lesson.guidedSteps[1]]};
  const result=await generateLearning({...input,action:"lesson"},options(vi.fn<typeof fetch>().mockResolvedValue(response(oversized))));
  expect(lessonSchema.parse(result).guidedSteps[0].exampleCode).toBe("");
  expect(lessonSchema.parse(result).guidedSteps[0].instruction).toBe(lesson.guidedSteps[0].instruction);
  await expect(generateLearning({...input,action:"lesson"},options(vi.fn<typeof fetch>().mockResolvedValue(response({...oversized,guidedSteps:[{...oversized.guidedSteps[0],filePath:"../private"},oversized.guidedSteps[1]]}))))).rejects.toMatchObject({code:"INVALID_RESPONSE"});
 });
 it("rejects unfinished, malformed and oversized hint replies",async()=>{
  await expect(generateLearning(input,options(vi.fn<typeof fetch>().mockResolvedValue(response(reply,"MAX_TOKENS"))))).rejects.toMatchObject({code:"INCOMPLETE"});
  await expect(generateLearning(input,options(vi.fn<typeof fetch>().mockResolvedValue(response({explanation:"Missing fields"}))))).rejects.toMatchObject({code:"INVALID_RESPONSE"});
  await expect(generateLearning(input,options(vi.fn<typeof fetch>().mockResolvedValue(response({...reply,code:Array(12).fill("code").join("\n")}))))).rejects.toMatchObject({code:"TEACHING_LIMIT"});
 });
 it("requires a known milestone and an answer for assessment",()=>{
  expect(learningRequestSchema.safeParse({...input,milestoneId:"other"}).success).toBe(false);
  expect(learningRequestSchema.safeParse({...input,action:"check",answer:""}).success).toBe(false);
  expect(lessonSchema.safeParse({sections:[],example:{},knowledgeCheck:""}).success).toBe(false);
 });
 it("keeps failure details private and never automatically retries quota errors",async()=>{
  const fetcher=vi.fn<typeof fetch>().mockResolvedValue(new Response("private",{status:429}));
  await expect(generateLearning(input,options(fetcher))).rejects.toMatchObject({code:"RATE_LIMITED"});expect(fetcher).toHaveBeenCalledTimes(1);
  await expect(generateLearning(input,options(vi.fn<typeof fetch>().mockRejectedValue(new Error("secret"))))).rejects.toMatchObject({code:"CONNECTION_ERROR"});
 });
 it("aborts stalled requests",async()=>{
  const fetcher:typeof fetch=(_url,init)=>new Promise((_resolve,reject)=>init?.signal?.addEventListener("abort",()=>reject(new Error("aborted"))));
  await expect(generateLearning(input,{...options(fetcher),timeoutMs:5})).rejects.toMatchObject({code:"TIMEOUT"});
 });
 it("checks origin, request size and input before invoking AI",async()=>{
  const generate=vi.fn().mockResolvedValue(reply);
  const request=(body:unknown,origin="http://localhost:3000")=>new Request("http://localhost:3000/api/learning",{method:"POST",headers:{origin,"content-type":"application/json"},body:JSON.stringify(body)});
  expect((await handleLearningRequest(request(input,"https://other.example"),generate)).status).toBe(403);
  expect((await handleLearningRequest(request({...input,work:"x".repeat(300001)}),generate)).status).toBe(413);
  expect((await handleLearningRequest(request({...input,milestoneId:"other"}),generate)).status).toBe(400);
  expect(generate).not.toHaveBeenCalled();
  expect((await handleLearningRequest(request(input),generate)).status).toBe(200);
 });
});
describe("student-confirmed progress",()=>{
 it("requires criteria and prerequisites but does not require a passed AI assessment",()=>{
  const activity={...emptyActivity(),checkedCriteria:[0],review:{passed:false,feedback:"Try again",nextStep:"Explain state"}};
  expect(()=>confirmMilestone(project(),"one",emptyActivity())).toThrow("criterion");
  expect(()=>confirmMilestone(project(),"two",activity)).toThrow("prerequisite");
  const completed=confirmMilestone(project(),"one",activity);
  expect(completed.completedMilestoneIds).toEqual(["one"]);
  expect(completed.learning?.one.review?.passed).toBe(false);
  expect(completed.learning?.one.completionConfirmedAt).toBeTruthy();
  expect(confirmMilestone(completed,"one",activity).completedMilestoneIds).toHaveLength(1);
 });
 it("lesson reading and correct checks alone never complete a task",()=>{
  const value=sessionProjectSchema.parse({...project(),learning:{one:{...emptyActivity(),lesson,review:{passed:true,feedback:"Correct",nextStep:"Build it"}}}});
  expect(value.completedMilestoneIds).toEqual([]);
 });
 it("reopens progress safely without dropping work or affecting another project",()=>{
  const activity={...emptyActivity(),checkedCriteria:[0],work:"Saved notes"};
  const one=confirmMilestone(project(),"one",activity),two=confirmMilestone(one,"two",activity);
  expect(()=>reopenMilestone(two,"one")).toThrow("Reopen");
  const reopened=reopenMilestone(one,"one");
  expect(reopened.completedMilestoneIds).toEqual([]);expect(reopened.learning?.one.work).toBe("Saved notes");expect(project().completedMilestoneIds).toEqual([]);
 });
 it("rejects learning records for unrelated milestones or criteria",()=>{
  expect(sessionProjectSchema.safeParse({...project(),learning:{other:emptyActivity()}}).success).toBe(false);
  expect(sessionProjectSchema.safeParse({...project(),learning:{one:{...emptyActivity(),checkedCriteria:[9]}}}).success).toBe(false);
 });
});
