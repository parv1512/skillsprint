import { authConfigured, getIdentity } from "@/lib/auth";
import { safeFailure } from "@/lib/server/workspace-handler";
export const runtime = "nodejs";
export async function GET() {
  try { return Response.json({authenticated: !!await getIdentity(), authConfigured: authConfigured(), storageConfigured: !!process.env.DATABASE_URL}, {headers: {"Cache-Control": "no-store"}}); }
  catch(error) { return safeFailure(error); }
}
