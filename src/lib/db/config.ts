export function normalizeDatabaseUrl(value: string) {
  const url = new URL(value);
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname) throw new Error("Use a PostgreSQL connection URL.");
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    // Require authenticated TLS even if the provider's copied URL uses weaker SSL modes.
    url.searchParams.set("sslmode", "verify-full");
    url.searchParams.delete("uselibpqcompat");
    url.searchParams.delete("ssl");
  }
  return url.toString();
}
