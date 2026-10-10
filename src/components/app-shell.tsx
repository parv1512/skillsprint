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
  const {mode, ready, error, refreshWorkspace, sessionProjects, importSessionProjects, authenticated} = useProjects();
  const [importing, setImporting] = useState(false), [importError, setImportError] = useState("");
  return <div className="app-shell field-notes">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <aside className="sidebar">
      <Link href="/" className="brand" aria-label="SkillSprint home"><span className="brand-mark"><Icon name="spark" /></span>SkillSprint<span className="brand-dot">.</span></Link>
      <nav aria-label="Main navigation">{navigation.map((item) => <Link key={item.href} href={item.href} className={`nav-item ${pathname === item.href ? "active" : ""}`} aria-current={pathname === item.href ? "page" : undefined}><Icon name={item.icon} />{item.label}{pathname === item.href && <span className="nav-dot" />}</Link>)}</nav>
      {ready && (authenticated ? <a className="nav-item" href="/auth/logout">Sign out</a> : mode === "signed-out" ? <a className="button button-primary" href="/auth/login">Sign in</a> : null)}
    </aside>
    <div className="main-column">
      <main id="main-content" tabIndex={-1}>
        {ready && mode === "preview" && <p className="notice">Sign-in setup is pending. Existing session projects remain available to view.</p>}
        {ready && mode === "signed-out" && <p className="notice">Sign in to return to your projects and Learning Passport. <a href="/auth/login">Sign in →</a></p>}
        {ready && mode === "unavailable" && <div role="alert" className="notice notice-error"><p>{error ?? "Your workspace couldn’t be loaded."}</p><button className="button button-secondary" onClick={() => void refreshWorkspace()}>Retry</button></div>}
        {mode === "persistent" && sessionProjects.length > 0 && <details className="notice"><summary>Import {sessionProjects.length} session project{sessionProjects.length === 1 ? "" : "s"}</summary><p>Import roadmaps and your notes. Completion and AI materials reset, including lessons, starter files, conversations, and reviews. Browser copies remain intact; imported work earns no Passport evidence until reconfirmed.</p><button className="button button-secondary" disabled={importing} onClick={async () => {setImporting(true); setImportError(""); try {await importSessionProjects();} catch(cause) {setImportError(cause instanceof Error ? cause.message : "Import failed.");} finally {setImporting(false);}}}>{importing ? "Importing…" : "Import into my account"}</button>{importError && <p role="alert">{importError}</p>}</details>}
        {children}
      </main>
      <footer>{mode === "persistent" ? "Saved to your account · Evidence stays with your Learning Passport." : "Your browser session projects have been preserved."}</footer>
    </div>
  </div>;
}
