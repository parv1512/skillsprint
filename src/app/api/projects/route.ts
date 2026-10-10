import { workspaceRoute } from "@/lib/server/workspace";
export const runtime = "nodejs";
export async function GET(request: Request) { return workspaceRoute(request, "projects"); }
export async function POST(request: Request) { return workspaceRoute(request, "projects"); }
