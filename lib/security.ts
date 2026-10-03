import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { headers, cookies } from "next/headers";
import { db } from "./db";
import { z } from "zod";
import { databaseConfigured } from "./config";
export const uuid = z.string().uuid();
export function token() {
  return randomBytes(32).toString("hex");
}
export function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};
export async function guestToken() {
  return (await cookies()).get("checkout")?.value;
}
export async function sameOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (!origin || new URL(origin).host !== h.get("host"))
    throw new Error("Invalid request origin.");
}
export async function rateLimit(
  scope: string,
  identity: string,
  limit = 10,
  seconds = 600,
) {
  if (!databaseConfigured())
    throw new Error(
      "Store setup is incomplete. Configure the database connection before continuing.",
    );
  const key = hash(`${scope}:${identity}`);
  const result = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO rate_limits (key, count, expires_at) VALUES (${key}, 1, NOW() + ${seconds} * INTERVAL '1 second')
    ON CONFLICT (key) DO UPDATE SET count = CASE WHEN rate_limits.expires_at < NOW() THEN 1 ELSE rate_limits.count + 1 END,
    expires_at = CASE WHEN rate_limits.expires_at < NOW() THEN NOW() + ${seconds} * INTERVAL '1 second' ELSE rate_limits.expires_at END RETURNING count`;
  if (result[0].count > limit)
    throw new Error("Too many attempts. Please try again later.");
}
export async function requestLimit(scope: string, limit = 30) {
  const h = await headers();
  // Vercel overwrites this header at its trusted edge. Local development shares one limit.
  await rateLimit(
    scope,
    process.env.VERCEL
      ? (h.get("x-vercel-forwarded-for") ?? "unknown")
      : "local",
    limit,
  );
}
export function errorMessage(error: unknown) {
  if (error instanceof z.ZodError)
    return error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
  if (error instanceof Error && !("code" in error)) return error.message;
  console.error("Operation failed", error);
  return "Could not save this change. Please try again.";
}
