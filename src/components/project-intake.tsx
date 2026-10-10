"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { projectIntakeSchema, roadmapSchema } from "@/lib/domain/validation";
import type { ProjectIntake } from "@/lib/domain/types";
import type { SessionProject } from "@/lib/projects/store";
import { useProjects } from "./project-provider";
import { RoadmapView } from "./roadmap-view";
import { Icon } from "./icon";

export function ProjectIntakeForm() {
  const router = useRouter();
  const { saveProject } = useProjects();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Partial<Record<keyof ProjectIntake, string[]>>>({});
  const [generated, setGenerated] = useState<SessionProject | null>(null);

  async function save(project: SessionProject) {
    await saveProject(project);
    router.push(`/projects/${project.id}`);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    const data = new FormData(event.currentTarget);
    const input = projectIntakeSchema.safeParse({
      idea: data.get("idea"), experience: data.get("experience"),
      availableHours: Number(data.get("availableHours")), preferredStack: data.get("preferredStack") || undefined,
      learningGoals: data.get("learningGoals"),
    });
    if (!input.success) {
      const errors = input.error.flatten().fieldErrors;
      setFields(errors);
      const first = Object.keys(errors)[0];
      (event.currentTarget.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }
    setFields({});
    setGenerated(null);
    setBusy(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 65_000);
    try {
      const response = await fetch("/api/roadmaps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input.data), signal: controller.signal });
      const body = await response.json();
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Couldn’t create your roadmap. Please try again.");
      const roadmap = roadmapSchema.safeParse(body.roadmap);
      if (!roadmap.success) throw new Error("The roadmap couldn’t be read safely. Please try again.");
      const project: SessionProject = { id: crypto.randomUUID(), intake: input.data, roadmap: roadmap.data, completedMilestoneIds: [], createdAt: new Date().toISOString() };
      setGenerated(project);
      await save(project);
    } catch (cause) {
      setError(controller.signal.aborted ? "Generation took too long. Your idea is still here; please try again." : cause instanceof Error ? cause.message : "Couldn’t generate your roadmap. Your idea is still here.");
    } finally { clearTimeout(timer); setBusy(false); }
  }

  const fieldError = (name: keyof ProjectIntake) => fields[name] ? <p className="field-error" id={`${name}-error`}>{fields[name]?.join(" ")}</p> : null;
  return <>
    <div className="page-heading"><div><p className="eyebrow">01 / BEGIN WITH AN IDEA</p><h1>What would you<br />love to build?</h1><p className="subtitle">Tell us what you’re imagining. We’ll find a practical first version<br className="desktop-break" /> and the steps to get there.</p></div></div>
    <div className="intake-layout"><form className="intake-form" onSubmit={submit} aria-busy={busy}>
      <div className="form-field"><label htmlFor="idea">Your project idea</label><p id="idea-help">What should it do, and who is it for? A few sentences are enough.</p><textarea id="idea" name="idea" rows={4} required minLength={10} maxLength={2000} placeholder="I want to build a study planner that helps students organize assignments and plan their week…" aria-invalid={!!fields.idea} aria-describedby={`idea-help${fields.idea ? " idea-error" : ""}`} disabled={busy} />{fieldError("idea")}</div>
      <div className="form-pair"><div className="form-field"><label htmlFor="experience">Where are you starting?</label><select id="experience" name="experience" required defaultValue="" disabled={busy} aria-invalid={!!fields.experience} aria-describedby={fields.experience ? "experience-error" : undefined}><option value="" disabled>Choose your experience</option><option value="beginner">Beginner — starting out</option><option value="some-experience">Some experience — built small things</option><option value="intermediate">Intermediate — ready to go further</option></select>{fieldError("experience")}</div><div className="form-field"><label htmlFor="availableHours">Time for this project</label><div className="input-unit"><input id="availableHours" name="availableHours" type="number" min="1" max="1000" step="0.5" required placeholder="12" disabled={busy} aria-invalid={!!fields.availableHours} aria-describedby={fields.availableHours ? "availableHours-error" : undefined} /><span>hours</span></div>{fieldError("availableHours")}</div></div>
      <div className="form-field"><label htmlFor="learningGoals">What do you want to learn?</label><textarea id="learningGoals" name="learningGoals" rows={2} required minLength={3} maxLength={1000} placeholder="React state, API requests, and how to finish a working project." disabled={busy} aria-invalid={!!fields.learningGoals} aria-describedby={fields.learningGoals ? "learningGoals-error" : undefined} />{fieldError("learningGoals")}</div>
      <div className="form-field"><label htmlFor="preferredStack">Preferred language or stack <span className="optional-label">Optional</span></label><input id="preferredStack" name="preferredStack" maxLength={200} placeholder="React and TypeScript, Python, or leave it open" disabled={busy} aria-invalid={!!fields.preferredStack} aria-describedby={fields.preferredStack ? "preferredStack-error" : undefined} />{fieldError("preferredStack")}</div>
      {error && <p role="alert" className="notice notice-error">{error}</p>}
      {busy && <p role="status" className="generating-status"><span className="loading-spinner" />Gemini is creating your milestones. This can take up to a minute.</p>}
      <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Creating your roadmap…" : "Create my roadmap"}<Icon name="arrow" /></button>
      <p className="form-disclosure">Your project details are sent to Gemini to create this plan. Leave out secrets and private information. Projects are stored only in this tab’s session for now.</p>
    </form><aside className="intake-margin"><p className="eyebrow">A PLAN YOU CAN ACT ON</p><h2>Ambition, with<br />a starting point.</h2><p>Your roadmap will include practical tasks, useful concepts, official references, and clear ways to check each milestone.</p><div className="evidence-note"><span className="margin-rule" /><p>Short on time?<br /><span>If your idea needs a smaller first version, the plan will explain the trade-off.</span></p></div><p className="quiet-note">Estimates are guidance. Your pace is your own.</p></aside></div>
    {generated && !busy && <section className="unsaved-roadmap"><p role="status" className="notice notice-warning">Your roadmap was generated, but couldn’t be saved. Keep this page open to view it.</p><button className="button button-secondary" onClick={async () => { setBusy(true); try { await save(generated); } catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn’t save."); } finally { setBusy(false); } }}>Try saving again</button><RoadmapView roadmap={generated.roadmap} /></section>}
  </>;
}
