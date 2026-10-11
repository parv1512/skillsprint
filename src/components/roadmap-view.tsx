"use client";

import { useState } from "react";
import type { Roadmap, Milestone } from "@/lib/domain/types";
import { findSkill } from "@/lib/domain/skills";
import { Icon } from "./icon";

export function RoadmapView({ roadmap, completedIds = [], renderLearning, renderMilestoneResult }: { roadmap: Roadmap; completedIds?: string[]; renderLearning?: (milestone: Milestone) => React.ReactNode; renderMilestoneResult?: (milestone: Milestone) => React.ReactNode }) {
  const next = roadmap.milestones.findIndex((milestone) => !completedIds.includes(milestone.id));
  const [selected, setSelected] = useState(Math.max(0, next));
  const [railExpanded, setRailExpanded] = useState(false);
  function openRail() {if(renderLearning && window.innerWidth > 700)setRailExpanded(true); }
  const milestone = roadmap.milestones[selected];
  const totalHours = roadmap.milestones.reduce((sum, item) => sum + item.estimatedHours, 0);
  return <>
    <div className="roadmap-overview"><div><p className="eyebrow">PROJECT ROADMAP</p><h1>{roadmap.title}</h1><p className="subtitle">{roadmap.summary}</p></div><div className="roadmap-facts"><span>{roadmap.milestones.length} milestone{roadmap.milestones.length===1?"":"s"}</span><span>~{totalHours} hours</span><span>{completedIds.length} / {roadmap.milestones.length} complete</span></div></div>
    {roadmap.scopeNotes && <div className="notice notice-warning"><strong>A focused first version</strong><p>{roadmap.scopeNotes}</p></div>}
    <div className={`roadmap-workspace${renderLearning ? " milestone-navigation" : ""}`}><nav className={`milestone-rail${railExpanded ? " milestone-rail-expanded" : ""}`} aria-label="Roadmap milestones" onMouseEnter={openRail} onMouseLeave={() => setRailExpanded(false)} onFocusCapture={openRail} onBlurCapture={event => {if(!event.currentTarget.contains(event.relatedTarget as Node | null))setRailExpanded(false);}}><p className="eyebrow">MILESTONES</p><ol>{roadmap.milestones.map((item, index) => {
      const complete = completedIds.includes(item.id);
      const ready = item.prerequisiteIds.every((id) => completedIds.includes(id));
      const status = complete ? "Completed" : ready ? "Ready to begin" : "Upcoming";
      return <li key={item.id}><button type="button" className={`milestone-selector ${selected === index ? "selected" : ""}`} onClick={() => {setSelected(index);setRailExpanded(false);}} aria-label={`${index + 1}, ${item.title}, ${status.toLowerCase()}`} aria-controls="milestone-detail" aria-pressed={selected === index}><span className={`milestone-number ${complete ? "complete" : ""}`}>{index + 1}{complete && <span className="milestone-completed-mark" aria-hidden="true"><Icon name="check" width="10" /></span>}</span><span className="milestone-caption"><strong>{item.title}</strong><small>{status} · ~{item.estimatedHours}h</small>{item.prerequisiteIds.length > 0 && <small className="dependency-note">Depends on {item.prerequisiteIds.map((id) => String(roadmap.milestones.findIndex((previous) => previous.id === id) + 1).padStart(2, "0")).join(", ")}</small>}</span></button></li>;
    })}</ol></nav>
      <section id="milestone-detail" className="milestone-detail" aria-labelledby="milestone-title" key={milestone.id}><p className="eyebrow">MILESTONE {String(selected + 1).padStart(2, "0")} / ~{milestone.estimatedHours} HOURS</p><h2 id="milestone-title">{milestone.title}</h2>{renderMilestoneResult?.(milestone)}<p className="milestone-outcome">{milestone.outcome}</p>
        {milestone.prerequisiteIds.length > 0 && <p className="prerequisite-summary">Before this milestone: {milestone.prerequisiteIds.map((id) => roadmap.milestones.find((item) => item.id === id)?.title).join("; ")}.</p>}
        {renderLearning ? renderLearning(milestone) : <><div className="brief-section"><h3>Skills</h3><ul className="concept-list">{milestone.skillIds.map((id) => { const skill = findSkill(id); return <li key={id}><span className="skill-state skill-new">New</span><div><strong>{skill?.name ?? id}</strong></div></li>; })}</ul></div>
        <div className="brief-section"><h3>Tasks</h3><ol className="task-list">{milestone.tasks.map((task, index) => <li key={index}><span>{String(index + 1).padStart(2, "0")}</span><p>{task}</p></li>)}</ol></div>
        <div className="brief-section"><h3>Completion criteria</h3><ul className="criteria-list">{milestone.acceptanceCriteria.map((criterion, index) => <li key={index}>{criterion}</li>)}</ul></div>
        <div className="assessment-note"><p className="eyebrow">CHECK YOUR UNDERSTANDING</p><p>{milestone.assessmentPrompt}</p><small>Not assessed yet</small></div>
        {milestone.resources.length > 0 && <div className="brief-section"><h3>References</h3><ul className="resource-list">{milestone.resources.map((resource) => <li key={resource.url}><a href={resource.url} target="_blank" rel="noopener noreferrer">{resource.title}<Icon name="arrow" width="16" /><span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul></div>}
        <p className="brief-footer">Save this roadmap to open its learning workspace.</p></>}
      </section>
    </div>
  </>;
}
