"use client";
import { useEffect, useRef, useState } from "react";
import type { GuidedStep, Lesson, TutorMode } from "@/lib/domain/learning";
import type { Starter } from "@/lib/domain/starter";
import {revealResult} from "./result-focus";

type Props = {
  lesson?: Lesson; starter?: Starter; setupReady: boolean; localSetupConfirmed: boolean; completedStepIds: string[];
  busy: boolean; prerequisitesReady: boolean; milestoneCompleted: boolean;
  confirmSetup: () => Promise<void>; confirmStep: (id: string) => Promise<boolean>;
  generate: () => void; openFiles: (path?: string) => void; openWork: () => void;
  help: (mode: TutorMode, question: string) => void;
  work: string; changeWork: (work: string) => void; saveWork: () => Promise<void>;
};

export function GuidedBuild({lesson, starter, setupReady, localSetupConfirmed, completedStepIds, busy, prerequisitesReady, milestoneCompleted, confirmSetup, confirmStep, generate, openFiles, openWork, help, work, changeWork, saveWork}: Props) {
  const steps = lesson?.guidedSteps ?? [];
  const nextIndex = completedStepIds.length;
  const [reviewIndex, setReviewIndex] = useState<number>();
  const [attemptOpen, setAttemptOpen] = useState(false);
  const [reviewNeedsAttempt, setReviewNeedsAttempt] = useState(false);
  const [navigationRequest, setNavigationRequest] = useState(0);
  const activeStep = useRef<HTMLLIElement>(null);
  const attempt = useRef<HTMLTextAreaElement>(null);
  const index = reviewIndex !== undefined && reviewIndex < completedStepIds.length ? reviewIndex : Math.min(nextIndex, steps.length - 1);
  const step = steps[index];
  useEffect(() => {
    if (!navigationRequest) return;
    revealResult(activeStep.current);
  }, [index, navigationRequest]);
  function showStep(previous?: number) {
    setReviewIndex(previous);
    setNavigationRequest(value => value + 1);
  }
  function ask(mode: TutorMode, selected: GuidedStep) {
    if (mode === "review" && !work.trim()) {
      setReviewNeedsAttempt(true);
      setAttemptOpen(true);
      requestAnimationFrame(() => attempt.current?.focus());
      return;
    }
    setReviewNeedsAttempt(false);
    const request = mode === "hint" ? "Can you give me a hint" : mode === "explain" ? "Can you explain what I’m learning" : "Can you review my attempt";
    help(mode, `${request} for “${selected.title}” in ${selected.filePath}?`);
  }
  if (!prerequisitesReady) return <section className="guided-build"><h3>Finish the previous milestone first</h3><p>Its work prepares you for these steps.</p></section>;
  const setupPanel = <section className="guided-build">
    <span className="eyebrow">START HERE</span><h3>Open your project in your editor</h3>
    {starter ? <ol>{!starter.setupSteps.some(step => /\b(extract|unzip)\b/i.test(step)) && <li>Download the starter ZIP and extract it. Your files are inside the starter-project folder.</li>}{starter.setupSteps.map((step, i) => <li key={i}>{step}</li>)}</ol> : <p>Create the starter files, download and extract the ZIP, then open the starter-project folder in Cursor or VS Code.</p>}
    <div className="workspace-actions"><button className="button button-secondary" onClick={() => openFiles()}>Show starter files</button><button className="button button-primary" disabled={busy} onClick={() => void confirmSetup()}>My project runs locally →</button></div>
    <p className="quiet-note">Your confirmation; SkillSprint has not run the code.</p>
    {!steps.length && <button className="text-link" disabled={busy} onClick={generate}>Preview building steps</button>}
  </section>;
  if (!setupReady && !milestoneCompleted && !steps.length) return setupPanel;
  const setupConfirmation = localSetupConfirmed && <p className="quiet-note">Local setup confirmed by you. SkillSprint did not run your project.</p>;
  if (!steps.length) return <>{setupConfirmation}<section className="guided-build"><span className="eyebrow">YOUR NEXT ACTION</span><h3>Build this milestone one change at a time</h3><p>Create a sequence with the file to edit, what to write, and how to check each change.</p><button className="button button-primary" disabled={busy} onClick={generate}>{lesson ? "Create guided steps" : "Create building steps"}</button></section></>;
  return <>{setupConfirmation}{!setupReady && !milestoneCompleted && <details className="guided-setup"><summary>Before editing: open your project locally</summary>{setupPanel}</details>}<section className="guided-build" aria-label="Guided building steps">
    <p role="status" className="quiet-note">{index < nextIndex ? "Viewing" : "Now on"} step {index + 1} of {steps.length}: {step.title}.</p>
    <ol className="guided-steps">
    {steps.map((item, itemIndex) => itemIndex !== index ? <li key={item.id} className="guided-step-summary">
      <span className="eyebrow">STEP {itemIndex + 1}</span>
      {itemIndex < nextIndex ? <><button className="text-link" disabled={busy} onClick={() => showStep(itemIndex)}>{item.title}</button><p>Confirmed by you</p></> : <><h4>{item.title}</h4><p>{itemIndex === nextIndex ? "Current task" : "Finish the current step first."}</p></>}
    </li> : <li key={item.id} ref={activeStep} tabIndex={-1} className="guided-step-open" aria-label={`Step ${index + 1}: ${step.title}`}>
    <div className="guided-step-heading"><span className="eyebrow">STEP {index + 1} OF {steps.length}</span><span className="quiet-note">{completedStepIds.includes(step.id) ? "Confirmed by you" : "Current task"}</span></div>
    <h3>{step.title}</h3><p>{step.concept}</p>
    <div className="guided-edit"><span className="eyebrow">EDIT <code>{step.filePath}</code></span><p>{step.instruction}</p>{starter?.files.some(file => file.path === step.filePath) && <button className="text-link" onClick={() => openFiles(step.filePath)}>View starter file</button>}</div>
    {step.exampleCode && <details className="guided-example"><summary>Small example</summary><pre className="code-block"><code>{step.exampleCode}</code></pre></details>}
    <div className="guided-result"><h4>You should see</h4><p>{step.expectedResult}</p><h4>Check your change</h4><p>{step.verification}</p></div>
    <details className="guided-reflection"><summary>Explain it to yourself</summary><p>{step.reflection}</p></details>
    <div className="workspace-actions"><button className="button button-secondary" disabled={busy} onClick={() => ask("hint", step)}>Give me a hint</button><button className="button button-secondary" disabled={busy} onClick={() => ask("explain", step)}>Explain this</button><button className="button button-secondary" disabled={busy} onClick={() => ask("review", step)}>Review my attempt</button></div>
    <details className="guided-attempt" open={attemptOpen} onToggle={event => setAttemptOpen(event.currentTarget.open)}><summary>Share your attempt</summary>{reviewNeedsAttempt && !work.trim() && <p role="status" className="quiet-note">A review needs your code or notes first. Add your attempt below.</p>}<div className="form-field"><label htmlFor="guided-attempt">Current code or notes</label><textarea id="guided-attempt" ref={attempt} className="code-input" rows={6} maxLength={12000} disabled={busy} value={work} onChange={event => changeWork(event.target.value)} placeholder="Paste your current snippet from your editor." /></div><div className="workspace-actions"><button className="button button-secondary" disabled={busy} onClick={() => void saveWork()}>Save attempt</button><button className="button button-secondary" disabled={busy || !work.trim()} onClick={() => ask("review", step)}>Review this step</button></div></details>
    <div className="guided-next">
      <div className="workspace-actions">
      {index > 0 && <button className="button button-secondary" disabled={busy} onClick={() => showStep(index - 1)}>Previous step</button>}
      {nextIndex < steps.length && index === nextIndex ? <button className="button button-primary" disabled={busy} onClick={async () => {if (await confirmStep(step.id)) showStep();}}>I made and checked this change →</button> : index < Math.min(nextIndex, steps.length - 1) ? <button className="button button-primary" disabled={busy} onClick={() => showStep()}>Back to current step</button> : <button className="button button-primary" disabled={busy} onClick={openWork}>Review milestone work →</button>}
      </div>
      <p className="quiet-note">Step confirmations save your place. Milestone completion and Passport checks are separate.</p>
    </div>
    </li>)}
    </ol>
  </section></>;
}
