import { ProjectIntakeForm } from "@/components/project-intake";
import type { Metadata } from "next";

export const metadata: Metadata = {title: "New project"};

export default function NewProjectPage() { return <ProjectIntakeForm />; }
