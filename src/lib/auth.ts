import "server-only";
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { safeAuthReason, safeReturnTo } from "./server/auth-error";

export function authConfigured() {
  return ["AUTH0_DOMAIN", "AUTH0_CLIENT_ID", "AUTH0_CLIENT_SECRET", "AUTH0_SECRET", "APP_BASE_URL"].every(key => !!process.env[key]?.trim());
}
let client: Auth0Client | undefined;
let fingerprint = "";
export function getAuth0() {
  if (!authConfigured()) throw new Error("Sign-in is not configured. Configure Auth0 in .env.local.");
  const configured = createHash("sha256").update(JSON.stringify([process.env.AUTH0_DOMAIN,process.env.AUTH0_CLIENT_ID,process.env.AUTH0_CLIENT_SECRET,process.env.AUTH0_SECRET,process.env.APP_BASE_URL])).digest("hex");
  if (!client || fingerprint !== configured) {
    client = new Auth0Client({ enableAccessTokenEndpoint: false, authorizationParameters: { scope: "openid" }, onCallback: async (error, context) => {
      if (error) {
        const reason = safeAuthReason(error);
        console.error("Sign-in callback failed:", reason);
        return NextResponse.redirect(new URL(`/sign-in-error?reason=${reason}`, process.env.APP_BASE_URL!));
      }
      return NextResponse.redirect(safeReturnTo(context.returnTo, process.env.APP_BASE_URL!));
    } });
    fingerprint = configured;
  }
  return client;
}
export async function getIdentity(): Promise<string | null> {
  if (!authConfigured()) return null;
  const session = await getAuth0().getSession();
  return session?.user.sub ?? null;
}
