import { StudioDashboard } from "@/components/studio-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {title: {absolute: "Overview | SkillSprint"}};

export default function Dashboard() { return <StudioDashboard />; }
