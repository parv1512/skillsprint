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
      existingKnowledge: data.get("existingKnowledge"),
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
    <div className="page-heading"><div><h1>New project</h1></div></div>
    <div className="intake-layout"><form className="intake-form" onSubmit={submit} aria-busy={busy}>
      <div className="form-field"><label htmlFor="idea">Your project idea</label><p id="idea-help">What should it do, and who is it for?</p><textarea id="idea" name="idea" rows={4} required minLength={10} maxLength={2000} placeholder="I want to build a study planner that helps students organize assignments and plan their week…" aria-invalid={!!fields.idea} aria-describedby={`idea-help${fields.idea ? " idea-error" : ""}`} disabled={busy} />{fieldError("idea")}</div>
      <div className="form-pair"><div className="form-field"><label htmlFor="experience">Experience</label><select id="experience" name="experience" required defaultValue="" disabled={busy} aria-invalid={!!fields.experience} aria-describedby={fields.experience ? "experience-error" : undefined}><option value="" disabled>Choose your experience</option><option value="beginner">Beginner</option><option value="some-experience">Some experience</option><option value="intermediate">Intermediate</option></select>{fieldError("experience")}</div><div className="form-field"><label htmlFor="availableHours">Time available to build</label><div className="input-unit"><input id="availableHours" name="availableHours" type="number" min="1" max="1000" step="0.5" required placeholder="12" disabled={busy} aria-invalid={!!fields.availableHours} aria-describedby={fields.availableHours ? "availableHours-error" : undefined} /><span>hours</span></div>{fieldError("availableHours")}</div></div>
      <div className="form-field"><label htmlFor="existingKnowledge">What do you already know?</label><textarea id="existingKnowledge" name="existingKnowledge" rows={2} required minLength={3} maxLength={1000} placeholder="HTML, CSS, and basic JavaScript — or “None yet”." disabled={busy} aria-invalid={!!fields.existingKnowledge} aria-describedby={fields.existingKnowledge ? "existingKnowledge-error" : undefined} />{fieldError("existingKnowledge")}</div>
      <div className="form-field"><label htmlFor="preferredStack">Preferred language or stack <span className="optional-label">Optional</span></label><input id="preferredStack" name="preferredStack" maxLength={200} placeholder="React and TypeScript, Python, or leave it open" disabled={busy} aria-invalid={!!fields.preferredStack} aria-describedby={fields.preferredStack ? "preferredStack-error" : undefined} />{fieldError("preferredStack")}</div>
      {error && <p role="alert" className="notice notice-error">{error}</p>}
      {busy && <p role="status" className="generating-status"><span className="loading-spinner" />Creating milestones… Up to a minute.</p>}
      <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Creating your roadmap…" : "Create my roadmap"}<Icon name="arrow" /></button>
      <p className="form-disclosure">Sent to Gemini. Don’t include secrets or private information.</p>
    </form></div>
    {generated && !busy && <section className="unsaved-roadmap"><p role="status" className="notice notice-warning">Your roadmap was generated, but couldn’t be saved. Keep this page open to view it.</p><button className="button button-secondary" onClick={async () => { setBusy(true); try { await save(generated); } catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn’t save."); } finally { setBusy(false); } }}>Try saving again</button><RoadmapView roadmap={generated.roadmap} /></section>}
  </>;
}
