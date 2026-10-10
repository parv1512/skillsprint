"use client";
import { useRef, useState } from "react";
import type { GuidedStep, Lesson, TutorMode } from "@/lib/domain/learning";
import type { Starter } from "@/lib/domain/starter";

type Props = {
  lesson?: Lesson; starter?: Starter; setupReady: boolean; completedStepIds: string[];
  busy: boolean; prerequisitesReady: boolean; milestoneCompleted: boolean;
  confirmSetup: () => Promise<void>; confirmStep: (id: string) => Promise<boolean>;
  generate: () => void; openFiles: (path?: string) => void; openWork: () => void;
  help: (mode: TutorMode, question: string) => void;
  work: string; changeWork: (work: string) => void; saveWork: () => Promise<void>;
};

export function GuidedBuild({lesson, starter, setupReady, completedStepIds, busy, prerequisitesReady, milestoneCompleted, confirmSetup, confirmStep, generate, openFiles, openWork, help, work, changeWork, saveWork}: Props) {
  const steps = lesson?.guidedSteps ?? [];
  const nextIndex = completedStepIds.length;
  const [reviewIndex, setReviewIndex] = useState<number>();
  const [attemptOpen, setAttemptOpen] = useState(false);
  const attempt = useRef<HTMLTextAreaElement>(null);
  const index = reviewIndex !== undefined && reviewIndex < completedStepIds.length ? reviewIndex : Math.min(nextIndex, steps.length - 1);
  const step = steps[index];
  function ask(mode: TutorMode, selected: GuidedStep) {
    if (mode === "review" && !work.trim()) {
      setAttemptOpen(true);
      requestAnimationFrame(() => attempt.current?.focus());
      return;
    }
    help(mode, `Current guided step: ${selected.title}\nFile: ${selected.filePath}\nTask: ${selected.instruction}\nExpected result: ${selected.expectedResult}\n${mode === "hint" ? "Give one short prose hint for my next edit. Leave the code field empty. Suggest one thing to try; do not write the component or the complete solution." : mode === "explain" ? `Explain the concept behind this edit: ${selected.concept}` : "Review my submitted work against this specific step; point out one issue or a useful next check. Do not claim to execute it."}`);
  }
  if (!prerequisitesReady) return <section className="guided-build"><h3>Finish the previous milestone first</h3><p>Its work prepares you for these steps.</p></section>;
  const setupPanel = <section className="guided-build">
    <span className="eyebrow">START HERE</span><h3>Open your project in your editor</h3>
    {starter ? <ol>{!starter.setupSteps.some(step => /\b(extract|unzip)\b/i.test(step)) && <li>Download the starter ZIP and extract it. Your files are inside the starter-project folder.</li>}{starter.setupSteps.map((step, i) => <li key={i}>{step}</li>)}</ol> : <p>Create the starter files, download and extract the ZIP, then open the starter-project folder in Cursor or VS Code.</p>}
    <div className="workspace-actions"><button className="button button-secondary" onClick={() => openFiles()}>Get starter files</button><button className="button button-primary" disabled={busy} onClick={() => void confirmSetup()}>My project runs locally →</button></div>
    <p className="quiet-note">Your confirmation; SkillSprint has not run the code.</p>
    {!steps.length && <button className="text-link" disabled={busy} onClick={generate}>Preview building steps</button>}
  </section>;
  if (!setupReady && !milestoneCompleted && !steps.length) return setupPanel;
  if (!steps.length) return <section className="guided-build"><span className="eyebrow">YOUR NEXT ACTION</span><h3>Build this milestone one change at a time</h3><p>Create a sequence with the file to edit, what to write, and how to check each change.</p><button className="button button-primary" disabled={busy} onClick={generate}>{lesson ? "Create guided steps" : "Create building steps"}</button></section>;
  return <>{!setupReady && !milestoneCompleted && <details className="guided-setup"><summary>Before editing: open your project locally</summary>{setupPanel}</details>}<section className="guided-build" aria-label="Guided building steps">
    <div className="guided-step-heading"><span className="eyebrow">STEP {index + 1} OF {steps.length}</span><span className="quiet-note">{completedStepIds.includes(step.id) ? "Confirmed by you" : "Current task"}</span></div>
    <h3>{step.title}</h3><p>{step.concept}</p>
    <div className="guided-edit"><span className="eyebrow">EDIT <code>{step.filePath}</code></span><p>{step.instruction}</p>{starter?.files.some(file => file.path === step.filePath) && <button className="text-link" onClick={() => openFiles(step.filePath)}>View starter file</button>}</div>
    {step.exampleCode && <details className="guided-example"><summary>Small example</summary><pre className="code-block"><code>{step.exampleCode}</code></pre></details>}
    <div className="guided-result"><h4>You should see</h4><p>{step.expectedResult}</p><h4>Check your change</h4><p>{step.verification}</p></div>
    <details className="guided-reflection"><summary>Explain it to yourself</summary><p>{step.reflection}</p></details>
    <div className="workspace-actions"><button className="button button-secondary" disabled={busy} onClick={() => ask("hint", step)}>Give me a hint</button><button className="button button-secondary" disabled={busy} onClick={() => ask("explain", step)}>Explain this</button><button className="button button-secondary" disabled={busy} onClick={() => ask("review", step)}>Review my attempt</button></div>
    <details className="guided-attempt" open={attemptOpen} onToggle={event => setAttemptOpen(event.currentTarget.open)}><summary>Share your attempt</summary><div className="form-field"><label htmlFor="guided-attempt">Current code or notes</label><textarea id="guided-attempt" ref={attempt} className="code-input" rows={6} maxLength={12000} disabled={busy} value={work} onChange={event => changeWork(event.target.value)} placeholder="Paste your current snippet from your editor." /></div><div className="workspace-actions"><button className="button button-secondary" disabled={busy} onClick={() => void saveWork()}>Save attempt</button><button className="button button-secondary" disabled={busy || !work.trim()} onClick={() => ask("review", step)}>Review this step</button></div></details>
    <div className="guided-next">
      {nextIndex < steps.length && index === nextIndex ? <button className="button button-primary" disabled={busy} onClick={async () => {if (await confirmStep(step.id)) setReviewIndex(undefined);}}>I made and checked this change →</button> : nextIndex >= steps.length ? <button className="button button-primary" disabled={busy} onClick={openWork}>Review milestone work →</button> : <button className="button button-primary" onClick={() => setReviewIndex(undefined)}>Return to current step →</button>}
      <p className="quiet-note">Step confirmations save your place. Milestone completion and Passport checks are separate.</p>
    </div>
    {completedStepIds.length > 0 && <details className="guided-history"><summary>Revisit a step</summary><ol>{steps.slice(0, completedStepIds.length).map((item, i) => <li key={item.id}><button className="text-link" onClick={() => setReviewIndex(i)}>{item.title}</button></li>)}</ol></details>}
  </section></>;
}
