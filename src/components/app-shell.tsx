"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";
import { useProjects } from "./project-provider";
import { useState } from "react";

const navigation = [
  { href: "/", label: "Overview", icon: "grid" as const },
  { href: "/projects", label: "My projects", icon: "code" as const },
  { href: "/passport", label: "Learning Passport", icon: "book" as const },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const projectPage = /^\/projects\/(?!new(?:\/|$))[^/]+\/?$/.test(pathname);
  const {mode, ready, error, refreshWorkspace, sessionProjects, importSessionProjects, authenticated, accountLabel, projects} = useProjects();
  const [importing, setImporting] = useState(false), [importError, setImportError] = useState("");
  return <div className={`app-shell field-notes${projectPage ? " project-shell" : ""}`}>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <aside className="sidebar">
      <Link href="/" className="brand" aria-label="SkillSprint home" aria-describedby={projectPage ? "project-navigation-help" : undefined}><span className="brand-mark"><Icon name="spark" /></span><span className="brand-name">SkillSprint</span><span className="brand-dot">.</span></Link>
      {projectPage && <span id="project-navigation-help" className="sr-only">Focus the logo or hover over the rail to open navigation. Tab through the links; tab out to close it.</span>}
      <nav aria-label="Main navigation">{navigation.map((item) => <Link key={item.href} href={item.href} className={`nav-item ${pathname === item.href ? "active" : ""}`} aria-current={pathname === item.href ? "page" : undefined}><Icon name={item.icon} />{item.label}{pathname === item.href && <span className="nav-dot" />}</Link>)}</nav>
      {ready && (authenticated ? <div className="sidebar-account">{accountLabel && <span className="account-label">{accountLabel}</span>}<a className="nav-item" href="/auth/logout">Sign out</a></div> : mode === "signed-out" ? <a className="button button-primary" href="/auth/login">Sign in</a> : null)}
    </aside>
    <div className="main-column">
      <main id="main-content" tabIndex={-1}>
        {ready && mode === "preview" && <p className="notice">Sign-in setup is pending. Existing session projects remain available to view.</p>}
        {ready && mode === "signed-out" && <p className="notice">Sign in to return to your projects and Learning Passport. <a href="/auth/login">Sign in →</a></p>}
        {ready && mode === "unavailable" && <div role="alert" className="notice notice-error"><p>{error ?? "Your workspace couldn’t be loaded."}</p><button className="button button-secondary" onClick={() => void refreshWorkspace()}>Retry</button></div>}
        {mode === "persistent" && sessionProjects.length > 0 && <details className="notice"><summary>Import {sessionProjects.length} session project{sessionProjects.length === 1 ? "" : "s"}</summary><p>Import roadmaps and your notes. Completion and AI materials reset, including lessons, starter files, conversations, and reviews. Browser copies remain intact; imported work earns no Passport evidence until reconfirmed.</p><button className="button button-secondary" disabled={importing} onClick={async () => {setImporting(true); setImportError(""); try {await importSessionProjects();} catch(cause) {setImportError(cause instanceof Error ? cause.message : "Import failed.");} finally {setImporting(false);}}}>{importing ? "Importing…" : "Import into my account"}</button>{importError && <p role="alert">{importError}</p>}</details>}
        {children}
      </main>
      <footer>{mode === "persistent" ? "Saved to your account · Evidence stays with your Learning Passport." : ready && (sessionProjects.length > 0 || mode === "preview" && projects.length > 0) ? "Your browser session projects have been preserved." : "SkillSprint · Learn by building."}</footer>
    </div>
  </div>;
}
