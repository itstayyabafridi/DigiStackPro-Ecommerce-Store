import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authClient } from "@/lib/supabase";
import { requireAdminIdentity } from "@/lib/auth";
import {
  adminSecurity,
  adminGrant,
  issueAdminGrant,
  clearAdminGrant,
} from "@/lib/admin-security";
import {
  sameOrigin,
  requestLimit,
  rateLimit,
  errorMessage,
} from "@/lib/security";
const schema = z.discriminatedUnion("step", [
  z.object({
    step: z.literal("password"),
    email: z
      .string()
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    password: z.string().min(1).max(1024),
  }),
  z.object({ step: z.literal("code"), code: z.string().regex(/^\d{6,10}$/) }),
]);
export async function POST(request: NextRequest) {
  try {
    await sameOrigin();
    await requestLimit("admin-login", 30);
    const input = schema.parse(await request.json());
    const client = await authClient();
    if (input.step === "password") {
      await clearAdminGrant();
      await rateLimit("admin-password", input.email, 10);
      const { error } = await client.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      if (error) throw new Error("Invalid email or password.");
      try {
        const user = await requireAdminIdentity();
        const security = await adminSecurity();
        if (security.emailVerificationEnabled) {
          const { error: sendError } = await client.auth.signInWithOtp({
            email: user.email!,
            options: { shouldCreateUser: false },
          });
          if (sendError)
            throw new Error(
              "Could not send a verification code. Wait a minute and try again.",
            );
          await issueAdminGrant(user.id, security.version, false, true);
          return NextResponse.json(
            {
              verificationRequired: true,
              message: "Enter the code sent to your email.",
            },
            { headers: { "Cache-Control": "no-store" } },
          );
        }
        await issueAdminGrant(user.id, security.version, false);
      } catch (error) {
        await client.auth.signOut({ scope: "local" });
        throw error;
      }
    } else {
      const user = await requireAdminIdentity();
      const security = await adminSecurity();
      const grant = await adminGrant(user.id, security.version);
      if (!grant || grant.emailVerified || !security.emailVerificationEnabled)
        throw new Error(
          "Sign in with your password again before entering a code.",
        );
      await rateLimit("admin-code", user.id, 10);
      const { data, error } = await client.auth.verifyOtp({
        email: user.email!,
        token: input.code,
        type: "email",
      });
      if (error || data.user?.id !== user.id)
        throw new Error("Invalid or expired code.");
      await issueAdminGrant(user.id, security.version, true);
    }
    return NextResponse.json(
      { verified: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: errorMessage(error) },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
