const messages: Record<string, string> = {
  invalid_client: "The application’s Auth0 client credentials need to be checked.",
  unauthorized_client: "This Auth0 application isn’t permitted to finish this login flow.",
  unsupported_grant_type: "The application’s authorization-code login setting needs to be enabled.",
  invalid_grant: "The login code expired or was already used. Start a fresh sign-in below.",
  invalid_state: "The login session was lost or expired. Start a fresh sign-in below.",
  missing_state: "This wasn’t a complete login return. Start a fresh sign-in below.",
  token_validation: "The identity token couldn’t be validated. Check the application’s Auth0 configuration.",
};
export default async function SignInError({searchParams}: {searchParams: Promise<{reason?: string}>}) {
  const reason = (await searchParams).reason ?? "callback_error";
  const message = Object.hasOwn(messages, reason) ? messages[reason] : "Please start a fresh sign-in. If it keeps failing, ask the application owner to check Auth0 settings.";
  return <section className="studio-empty"><h1>Sign-in didn’t finish</h1><p role="alert">{message}</p><a href="/auth/login" className="button button-primary">Try signing in again</a><p className="quiet-note">Start here rather than refreshing the previous login return page.</p></section>;
}
