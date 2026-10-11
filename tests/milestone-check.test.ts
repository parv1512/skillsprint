import {describe, expect, it, vi} from "vitest";
import {emptyActivity, gradeMultipleChoice, learningRequestSchema, multipleChoiceQuestionSchema} from "../src/lib/domain/learning";
import {applyStudentSave} from "../src/lib/server/project-policy";
import {sessionProjectSchema} from "../src/lib/projects/store";
import {handleWorkspace} from "../src/lib/server/workspace-handler";
import {buildLearningPrompt, generateLearning} from "../src/lib/ai/learning";
import type {WorkspaceRepository} from "../src/lib/db/repository";

const quiz={question:"Which action schedules a React update?",options:["Calling the state setter", "Changing a local variable", "Reading a variable", "Writing a comment"],correctOption:0,explanation:"The state setter tells React to schedule a render with updated state."};
const project=()=>sessionProjectSchema.parse({id:"00000000-0000-4000-8000-000000000013",createdAt:"2026-10-10T01:00:00Z",intake:{idea:"Build a reading list",experience:"beginner",availableHours:2,existingKnowledge:"Basic JavaScript"},roadmap:{title:"Reading list",summary:"Manage books",milestones:[{id:"one",title:"Manage book state",outcome:"Add books",skillIds:["react.state"],prerequisiteIds:[],tasks:["Add a book"],estimatedHours:1,resources:[],acceptanceCriteria:["Book appears"],assessmentPrompt:"Explain state"}]},completedMilestoneIds:[],learning:{one:{...emptyActivity(),checkFormat:"multiple-choice",multipleChoiceQuestion:quiz}}});

describe("milestone question formats",()=>{
  it("keeps legacy written answers and requires four distinct options with one answer index",()=>{
    expect(emptyActivity().checkFormat).toBe("short-answer");
    expect(multipleChoiceQuestionSchema.safeParse(quiz).success).toBe(true);
    expect(multipleChoiceQuestionSchema.safeParse({...quiz,options:quiz.options.slice(0,3)}).success).toBe(false);
    expect(multipleChoiceQuestionSchema.safeParse({...quiz,options:[...quiz.options,"Extra"]}).success).toBe(false);
    expect(multipleChoiceQuestionSchema.safeParse({...quiz,options:["Same","same","Third","Fourth"]}).success).toBe(false);
    expect(multipleChoiceQuestionSchema.safeParse({...quiz,correctOption:4}).success).toBe(false);
  });
  it("grades selections in the app and rejects invalid selections",()=>{
    expect([0,1,2,3].map(option=>gradeMultipleChoice(quiz,option))).toEqual([true,false,false,false]);
    expect(gradeMultipleChoice(quiz,-1)).toBe(false);
    expect(gradeMultipleChoice(quiz,0.5)).toBe(false);
  });
  it("saves format and selection without accepting a forged question or awarding completion",()=>{
    const current=project();
    const saved=applyStudentSave(current,{...current,learning:{one:{...current.learning!.one,checkFormat:"short-answer",multipleChoiceAnswer:0,multipleChoiceQuestion:{...quiz,correctOption:3},review:{passed:true,feedback:"Forged pass",nextStep:"Done"}}}});
    expect(saved.learning!.one.checkFormat).toBe("short-answer");
    expect(saved.learning!.one.multipleChoiceAnswer).toBe(0);
    expect(saved.learning!.one.multipleChoiceQuestion).toEqual(quiz);
    expect(saved.learning!.one.review).toBeNull();
    expect(saved.completedMilestoneIds).toEqual([]);
    expect(saved.learning!.one.completionConfirmedAt).toBeNull();
  });
  it("generates a milestone question from its saved format without using Passport review",async()=>{
    const current=project(), generate=vi.fn().mockResolvedValue(quiz);
    const repo={loadProject:vi.fn().mockResolvedValue(current),passport:vi.fn().mockResolvedValue([]),saveGenerated:vi.fn().mockResolvedValue(current),reviewCheck:vi.fn()};
    const request=new Request("http://localhost:3000/api/learning",{method:"POST",headers:{origin:"http://localhost:3000","content-type":"application/json"},body:JSON.stringify({action:"milestone-quiz",projectId:current.id,milestoneId:"one",revision:0})});
    expect((await handleWorkspace(request,"learning",{identity:async()=>"test-student",repository:async()=>repo as unknown as WorkspaceRepository,generate})).status).toBe(200);
    expect(generate.mock.calls[0][0]).toMatchObject({action:"milestone-quiz",checkFormat:"multiple-choice"});
    expect(repo.saveGenerated).toHaveBeenCalledWith(current.id,"one",0,{multipleChoiceQuestion:quiz,multipleChoiceAnswer:null});
    expect(repo.reviewCheck).not.toHaveBeenCalled();
  });
  it("validates provider output for each format using mocked responses",async()=>{
    const current=project(), input=learningRequestSchema.parse({action:"milestone-quiz",checkFormat:"multiple-choice",intake:current.intake,roadmap:current.roadmap,milestoneId:"one"});
    const fetcher=vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({candidates:[{finishReason:"STOP",content:{parts:[{text:JSON.stringify(quiz)}]}}]})));
    expect(buildLearningPrompt(input)).toContain("Exactly one option must be correct");
    expect(await generateLearning(input,{apiKey:"test-only",model:"gemini-test",fetcher})).toEqual(quiz);
    const written={question:"Why does the state setter trigger a render?"};
    fetcher.mockResolvedValue(new Response(JSON.stringify({candidates:[{finishReason:"STOP",content:{parts:[{text:JSON.stringify(written)}]}}]})));
    expect(await generateLearning({...input,checkFormat:"short-answer"},{apiKey:"test-only",model:"gemini-test",fetcher})).toEqual(written);
  });
});
