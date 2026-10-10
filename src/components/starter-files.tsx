"use client";
import { useState } from "react";
import type { Starter } from "@/lib/domain/starter";
import { createStarterArchive } from "@/lib/projects/starter-archive";

export function StarterFiles({ starter, busy, generate }: { starter?: Starter; busy: boolean; generate: () => void }) {
  const [selected, setSelected] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [open, setOpen] = useState(!starter);
  const file = starter?.files[selected] ?? starter?.files[0];
  function download() {
    if (!starter) return;
    const url = URL.createObjectURL(new Blob([createStarterArchive(starter)], { type: "application/zip" }));
    const link = document.createElement("a");
    link.href = url; link.download = "skillsprint-starter.zip"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFeedback("Starter downloaded");
  }
  return <details className="starter-section" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}><summary>Starter files</summary>
    {!starter ? <><p>Basic setup, file structure, and a first task.</p><button className="button button-secondary" disabled={busy} onClick={generate}>Create starter files</button></> : <>
      <p>{starter.summary}</p>
      <div className="starter-browser"><nav aria-label="Starter file structure">{starter.files.map((item, index) => <button type="button" key={item.path} aria-pressed={selected === index} onClick={() => { setSelected(index); setFeedback(""); }}><code>{item.path}</code></button>)}</nav><div className="starter-file">{file && <><h3>{file.path}</h3><p>{file.purpose}</p><pre className="code-block"><code>{file.content}</code></pre><button className="text-link" type="button" onClick={async () => { try { await navigator.clipboard.writeText(file.content); setFeedback("File copied"); } catch { setFeedback("Couldn’t copy. Select the code to copy it manually."); } }}>Copy file</button></>}</div></div>
      <h3>Set up locally</h3><ol className="starter-steps">{starter.setupSteps.map((step, index) => <li key={index}>{step}</li>)}</ol>
      <div className="next-step"><span className="eyebrow">YOUR FIRST TASK</span><strong>{starter.firstTask}</strong></div>
      <button className="button button-secondary" type="button" onClick={download}>Download starter ZIP</button>
      <p className="quiet-note">AI-generated starter. Not executed or tested by SkillSprint.</p>
      <p role="status" className="workspace-feedback">{feedback}</p>
    </>}
  </details>;
}
