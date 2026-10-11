import {rootCertificates} from "node:tls";
import type {PoolConfig} from "pg";

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

export function databasePoolConfig(value:string, ca?:string):PoolConfig {
  const connectionString=normalizeDatabaseUrl(value);
  if(!ca?.trim())return {connectionString};
  if(!ca.includes("-----BEGIN CERTIFICATE-----") || !ca.includes("-----END CERTIFICATE-----"))throw new Error("Configure a PEM database CA certificate.");
  const url=new URL(connectionString);
  // pg connection-string SSL parameters would otherwise overwrite the explicit CA.
  for(const key of ["sslmode","sslrootcert","ssl","uselibpqcompat"])url.searchParams.delete(key);
  return {connectionString:url.toString(),ssl:{rejectUnauthorized:true,ca:[...rootCertificates,ca]}};
}
