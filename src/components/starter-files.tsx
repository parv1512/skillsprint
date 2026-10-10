"use client";
import { useEffect, useState } from "react";
import type { Starter } from "@/lib/domain/starter";
import { createStarterArchive } from "@/lib/projects/starter-archive";
import { formatStarter } from "@/lib/projects/format-source";

export function StarterFiles({ starter, busy, generate, openRequest = 0, requestedPath, setupMilestone }: { starter?: Starter; busy: boolean; generate: () => void; openRequest?: number; requestedPath?: string; setupMilestone?: string }) {
  const [selected, setSelected] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [open, setOpen] = useState(!starter);
  useEffect(() => {
    if (openRequest > 0) setOpen(true);
    const index = starter?.files.findIndex(file => file.path === requestedPath) ?? -1;
    if (index >= 0) setSelected(index);
  }, [openRequest, requestedPath, starter]);
  const [formatted, setFormatted] = useState<{source: Starter; value: Starter}>();
  useEffect(() => {
    if (!starter) return;
    let active = true;
    void formatStarter(starter).then(value => { if (active) setFormatted({source: starter, value}); });
    return () => {active = false;};
  }, [starter]);
  const readable = formatted && formatted.source === starter ? formatted.value : undefined;
  const file = readable?.files[selected] ?? readable?.files[0];
  function download() {
    if (!readable) return;
    const url = URL.createObjectURL(new Blob([createStarterArchive(readable)], { type: "application/zip" }));
    const link = document.createElement("a");
    link.href = url; link.download = "skillsprint-starter.zip"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFeedback("Starter downloaded");
  }
  return <details className="starter-section" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}><summary>Starter files</summary>
    {!starter ? <><p>Basic setup, file structure, and a first task.</p>{setupMilestone ? <p>Open “{setupMilestone}” in the roadmap to create your starter.</p> : <button className="button button-secondary" disabled={busy} onClick={generate}>Create starter files</button>}</> : <>
      <p>{starter.summary}</p>
      <div className="starter-browser"><nav aria-label="Starter file structure">{starter.files.map((item, index) => <button type="button" key={item.path} aria-pressed={selected === index} onClick={() => { setSelected(index); setFeedback(""); }}><code>{item.path}</code></button>)}</nav><div className="starter-file">{!readable && <p role="status">Preparing readable files…</p>}{file && <><h3>{file.path}</h3><p>{file.purpose}</p><pre className="code-block starter-code" aria-label={`${file.path} source code`}><code>{file.content.trimEnd().split("\n").map((line, index) => <span className="code-line" key={index}><span className="line-number" aria-hidden="true">{index + 1}</span><span>{line || "\u200b"}</span></span>)}</code></pre><button className="text-link" type="button" onClick={async () => { try { await navigator.clipboard.writeText(file.content); setFeedback("File copied"); } catch { setFeedback("Couldn’t copy. Select the code to copy it manually."); } }}>Copy file</button></>}</div></div>
      <h3>Set up locally</h3><ol className="starter-steps">{starter.setupSteps.map((step, index) => <li key={index}>{step}</li>)}</ol>
      <details className="starter-exercise"><summary>Starter’s suggested first edit</summary><p>{starter.firstTask}</p></details>
      <button className="button button-secondary" type="button" disabled={!readable} onClick={download}>Download starter ZIP</button>
      <p className="quiet-note">AI-generated starter. Not executed or tested by SkillSprint.</p>
      <p role="status" className="workspace-feedback">{feedback}</p>
    </>}
  </details>;
}
