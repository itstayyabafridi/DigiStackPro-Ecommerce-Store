import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
const schema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().uuid(),
  version: z.string(),
  emailVerified: z.boolean(),
  expires: z.number(),
});
export type AdminGrant = z.infer<typeof schema>;
function signature(payload: string, key: string) {
  return createHmac("sha256", key).update(payload).digest("base64url");
}
export function signGrant(grant: AdminGrant, key: string) {
  const payload = Buffer.from(JSON.stringify(schema.parse(grant))).toString(
    "base64url",
  );
  return `${payload}.${signature(payload, key)}`;
}
export function readGrant(
  value: string | undefined,
  key: string,
  now = Date.now(),
): AdminGrant | null {
  if (!value || value.length > 2048) return null;
  const [payload, sig, ...rest] = value.split(".");
  if (!payload || !sig || rest.length) return null;
  const expected = Buffer.from(signature(payload, key));
  const actual = Buffer.from(sig);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return null;
  try {
    const grant = schema.parse(
      JSON.parse(Buffer.from(payload, "base64url").toString()),
    );
    return grant.expires > now ? grant : null;
  } catch {
    return null;
  }
}
