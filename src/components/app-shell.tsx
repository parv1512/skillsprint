"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";

const navigation = [
  { href: "/", label: "Overview", icon: "grid" as const },
  { href: "/projects", label: "My projects", icon: "code" as const },
  { href: "/passport", label: "Learning Passport", icon: "book" as const },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <div className="app-shell field-notes">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <aside className="sidebar">
      <Link href="/" className="brand" aria-label="SkillSprint home"><span className="brand-mark"><Icon name="spark" /></span>SkillSprint<span className="brand-dot">.</span></Link>
      <p className="nav-label">YOUR WORKSPACE</p>
      <nav aria-label="Main navigation">{navigation.map((item) => <Link key={item.href} href={item.href} className={`nav-item ${pathname === item.href ? "active" : ""}`} aria-current={pathname === item.href ? "page" : undefined}><Icon name={item.icon} />{item.label}{pathname === item.href && <span className="nav-dot" />}</Link>)}</nav>
      <div className="sidebar-note"><span className="nav-label">THE BUILDING METHOD</span><h2>Make. Understand.<br />Carry it forward.</h2><p>The work is yours. The guidance helps you take the next step.</p></div>
      <div className="workspace-status"><span className="status-dot" /><div><strong>Temporary workspace</strong><span>Projects stay in this tab’s session</span></div></div>
    </aside>
    <div className="main-column">
      <header className="topbar"><span>THE LEARNING STUDIO</span><span className="topbar-tag">Projects / Practice / Progress</span></header>
      <main id="main-content" tabIndex={-1}>{children}</main>
      <footer>SkillSprint &nbsp; / &nbsp; Learn something. Build with it.</footer>
    </div>
  </div>;
}
