import { ProjectRoadmap } from "@/components/project-roadmap";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectRoadmap id={id} />;
}
