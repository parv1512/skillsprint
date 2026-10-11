import { ProjectList } from "@/components/project-list";
import type { Metadata } from "next";

export const metadata: Metadata = {title: "My projects"};

export default function ProjectsPage() { return <ProjectList />; }
