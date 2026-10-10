import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ProjectProvider } from "@/components/project-provider";
import "./globals.css";
import "./studio.css";

export const metadata: Metadata = {
  title: { default: "SkillSprint — Learn by building", template: "%s | SkillSprint" },
  description: "Build real projects, learn with guidance, and carry your skills into your next idea.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><ProjectProvider><AppShell>{children}</AppShell></ProjectProvider></body></html>;
}
