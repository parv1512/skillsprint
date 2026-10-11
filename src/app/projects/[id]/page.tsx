import { ProjectRoadmap } from "@/components/project-roadmap";
import type { Metadata } from "next";

export const metadata: Metadata = {title: "Project roadmap"};

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectRoadmap id={id} />;
}
