import "server-only";
import { headers } from "next/headers";
import { isAdminHost } from "./routing";
export async function storefrontUrl() {
  const host = (await headers()).get("host") ?? "localhost:3000";
  if (!isAdminHost(host)) return "/";
  const storeHost = host.startsWith("admin.")
    ? host.slice(6)
    : process.env.ROOT_DOMAIN || host;
  return (
    process.env.SITE_URL ||
    `${host.includes("localhost") ? "http" : "https"}://${storeHost}`
  );
}
export async function siteUrl() {
  if (process.env.SITE_URL) return new URL(process.env.SITE_URL).origin;
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  return `${host.includes("localhost") ? "http" : "https"}://${host}`;
}
