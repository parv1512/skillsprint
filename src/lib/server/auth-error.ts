const providerReasons = new Set(["invalid_client", "invalid_grant", "invalid_request", "unauthorized_client", "unsupported_grant_type", "access_denied"]);
const sdkReasons = new Set(["invalid_state", "missing_state", "authorization_code_grant_error", "authorization_code_grant_request_error"]);
export function safeAuthReason(error: unknown) {
  const details = error as {code?: unknown; cause?: {code?: unknown; message?: unknown}} | null;
  if (typeof details?.cause?.code === "string" && providerReasons.has(details.cause.code)) return details.cause.code;
  if (typeof details?.cause?.message === "string" && /nonce|JWT|id_token|issuer|audience/i.test(details.cause.message)) return "token_validation";
  if (typeof details?.code === "string" && sdkReasons.has(details.code)) return details.code;
  return "callback_error";
}
export function safeReturnTo(returnTo: string | undefined, base: string) {
  const origin = new URL(base);
  try {const target = new URL(returnTo || "/", origin); return target.origin === origin.origin ? target : new URL("/", origin);}
  catch {return new URL("/", origin);}
}
