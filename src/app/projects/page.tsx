import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";

export default function ProjectsPage() {
  return <><div className="page-heading"><div><p className="eyebrow">MAKE SOMETHING YOURS</p><h1>My projects</h1><p className="subtitle">Each project has its own roadmap. Your learning connects them all.</p></div><Link href="/projects/new" className="button button-primary"><Icon name="plus" />New project</Link></div><section className="panel"><EmptyState title="Your first project starts with an idea" description="A study planner, a budgeting app, a tool for your community—choose something you want to bring to life." action={{ href: "/projects/new", label: "Explore a project" }} /></section></>;
}
