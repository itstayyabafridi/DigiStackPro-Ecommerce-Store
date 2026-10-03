import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { adminSecurity, issueAdminGrant } from "@/lib/admin-security";
import { authClient } from "@/lib/supabase";
import { db } from "@/lib/db";
import { sameOrigin, requestLimit, errorMessage } from "@/lib/security";
export async function POST(request: NextRequest) {
  try {
    await sameOrigin();
    const user = await requireAdmin();
    await requestLimit("admin-security", 10);
    const input = z
      .object({
        enabled: z.boolean(),
        code: z
          .string()
          .regex(/^\d{6,10}$/)
          .optional(),
      })
      .parse(await request.json());
    const current = await adminSecurity();
    if (current.emailVerificationEnabled === input.enabled)
      return NextResponse.json({ saved: true });
    if (input.enabled) {
      const client = await authClient();
      if (!input.code) {
        const { error } = await client.auth.signInWithOtp({
          email: user.email!,
          options: { shouldCreateUser: false },
        });
        if (error)
          throw new Error(
            "Could not send a code. Check Supabase email delivery settings, then try again.",
          );
        return NextResponse.json({ verificationRequired: true });
      }
      const { data, error } = await client.auth.verifyOtp({
        email: user.email!,
        token: input.code,
        type: "email",
      });
      if (error || data.user?.id !== user.id)
        throw new Error("Invalid or expired code.");
    }
    const values = {
      emailVerificationEnabled: input.enabled,
      version: randomUUID(),
    };
    await db.setting.upsert({
      where: { key: "admin-security" },
      create: { key: "admin-security", value: values },
      update: { value: values },
    });
    await issueAdminGrant(user.id, values.version, input.enabled);
    return NextResponse.json(
      { saved: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
