import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authClient } from "@/lib/supabase";
import {
  sameOrigin,
  requestLimit,
  rateLimit,
  errorMessage,
} from "@/lib/security";
import { claimOrders } from "@/lib/auth";
export async function POST(request: NextRequest) {
  try {
    await sameOrigin();
    await requestLimit("auth", 30);
    const input = z
      .object({
        email: z
          .string()
          .email()
          .max(254)
          .transform((v) => v.toLowerCase()),
        code: z
          .string()
          .regex(/^\d{6,10}$/)
          .optional(),
        admin: z.boolean().default(false),
      })
      .parse(await request.json());
    if (input.admin)
      throw new Error("Use the administrator email and password sign-in.");
    await rateLimit("email-auth", input.email, 10);
    const client = await authClient();
    if (!input.code) {
      const { error } = await client.auth.signInWithOtp({
        email: input.email,
        options: { shouldCreateUser: true },
      });
      if (error)
        throw new Error("Could not send a code. Please wait and try again.");
      return NextResponse.json(
        { message: "If this email can sign in, a code has been sent." },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const { error } = await client.auth.verifyOtp({
      email: input.email,
      token: input.code,
      type: "email",
    });
    if (error) throw new Error("Invalid or expired code. Request a new one.");
    await claimOrders();
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
