import { workspaceRoute } from "@/lib/server/workspace";
export const runtime = "nodejs";
export async function GET(request: Request, {params}: {params: Promise<{id: string}>}) { return workspaceRoute(request, "project", (await params).id); }
