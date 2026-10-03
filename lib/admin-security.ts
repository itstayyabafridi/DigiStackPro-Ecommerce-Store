import "server-only";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "./db";
import { authClient } from "./supabase";
import { readGrant, signGrant } from "./admin-grant";
export const adminCookie = "admin_access";
const schema = z.object({
  emailVerificationEnabled: z.boolean().default(false),
  version: z.string().default("initial"),
});
export async function adminSecurity() {
  const row = await db.setting.findUnique({ where: { key: "admin-security" } });
  return schema.parse(row?.value ?? {});
}
function secret() {
  const key = process.env.ADMIN_SESSION_SECRET;
  if (!key || key.length < 32)
    throw new Error(
      "Admin sign-in is not configured. Set ADMIN_SESSION_SECRET.",
    );
  return key;
}
export async function sessionId(userId: string) {
  const { data, error } = await (await authClient()).auth.getClaims();
  if (
    error ||
    data?.claims.sub !== userId ||
    typeof data.claims.session_id !== "string"
  )
    throw new Error("Please sign in again.");
  return data.claims.session_id;
}
export async function adminGrant(userId: string, version: string) {
  const grant = readGrant((await cookies()).get(adminCookie)?.value, secret());
  if (
    !grant ||
    grant.userId !== userId ||
    grant.version !== version ||
    grant.sessionId !== (await sessionId(userId))
  )
    return null;
  return grant;
}
export async function issueAdminGrant(
  userId: string,
  version: string,
  emailVerified: boolean,
  pending = false,
) {
  const seconds = pending ? 600 : 43200;
  const value = signGrant(
    {
      userId,
      sessionId: await sessionId(userId),
      version,
      emailVerified,
      expires: Date.now() + seconds * 1000,
    },
    secret(),
  );
  (await cookies()).set(adminCookie, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: seconds,
  });
}
export async function clearAdminGrant() {
  (await cookies()).delete(adminCookie);
}
