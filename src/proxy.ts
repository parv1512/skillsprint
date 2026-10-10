import { NextResponse, type NextRequest } from "next/server";
import { authConfigured, getAuth0 } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  if (!authConfigured()) {
    if (request.nextUrl.pathname.startsWith("/auth/")) return new NextResponse("Sign-in is not configured yet.", { status: 503 });
    return NextResponse.next();
  }
  return getAuth0().middleware(request);
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"] };
