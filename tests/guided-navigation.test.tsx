import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe, expect, it} from "vitest";
import {GuidedBuild} from "../src/components/guided-build";
import type {Lesson} from "../src/lib/domain/learning";

const lesson: Lesson = {
  sections: [], example: {language:"html",code:"",explanation:""}, knowledgeCheck:"Explain the change",
  guidedSteps: ["Structure", "Style", "Storage"].map((title, index) => ({
    id:`step-${index}`, title, filePath:`file-${index}.html`, concept:`Concept ${index}`,
    instruction:`Edit instruction ${index}`, expectedResult:`Expected result ${index}`,
    verification:`Check ${index}`, reflection:`Reflect ${index}`, exampleCode:"",
  })),
};
function render(completedStepIds: string[]) {
  return renderToStaticMarkup(createElement(GuidedBuild, {
    lesson, setupReady:true, localSetupConfirmed:true, completedStepIds,
    busy:false, prerequisitesReady:true, milestoneCompleted:false,
    confirmSetup:async () => {}, confirmStep:async () => true,
    generate:() => {}, openFiles:() => {}, openWork:() => {}, help:() => {},
    work:"", changeWork:() => {}, saveWork:async () => {},
  }));
}
describe("guided step navigation", () => {
  it("shows all titles but only opens the current instruction and locks future steps", () => {
    const html = render([]);
    expect(html).toContain("Now on step 1 of 3: Structure.");
    for (const title of ["Structure", "Style", "Storage"]) expect(html).toContain(title);
    for (const text of ["file-0.html", "Edit instruction 0", "Expected result 0", "Check 0"]) expect(html).toContain(text);
    expect(html).not.toContain("Edit instruction 1");
    expect(html.match(/Finish the current step first\./g)).toHaveLength(2);
    expect(html).not.toContain("Previous step");
    expect(html).not.toContain("Revisit a step");
  });
  it("opens the next confirmed position with previous navigation beside confirmation", () => {
    const html = render(["step-0"]);
    expect(html).toContain("Now on step 2 of 3: Style.");
    expect(html).toContain("Edit instruction 1");
    expect(html).not.toContain("Edit instruction 0");
    expect(html).toContain("Previous step");
    expect(html).toContain("I finished this step");
    expect(html.match(/Finish the current step first\./g)).toHaveLength(1);
  });
  it("keeps the final step open when all confirmations are saved and offers work review", () => {
    const html = render(["step-0", "step-1", "step-2"]);
    expect(html).toContain("Edit instruction 2");
    expect(html).toContain("Open completion criteria");
    expect(html).toContain("Previous step");
    expect(html).not.toContain("I finished this step");
    expect(html).not.toContain("Finish the current step first");
  });
});
