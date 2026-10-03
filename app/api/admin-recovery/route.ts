import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseEnv } from "@/lib/env";
import { db } from "@/lib/db";
import { sameOrigin, requestLimit } from "@/lib/security";
import { clearAdminGrant } from "@/lib/admin-security";

// A valid recovery identity may change its own password without a dashboard
// grant or the optional email second step. This route never issues admin access.
export async function POST(request: NextRequest) {
  try {
    await sameOrigin();
    await requestLimit("admin-recovery", 30);
    const { action } = z
      .object({ action: z.enum(["check", "complete"]) })
      .parse(await request.json());
    const header = request.headers.get("authorization") ?? "";
    if (!header.startsWith("Bearer ") || header.length > 16391)
      throw new Error("Invalid session");
    const env = supabaseEnv();
    const client = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await client.auth.getUser(header.slice(7));
    if (error || !data.user || !data.user.email_confirmed_at)
      throw new Error("Invalid session");
    const account = await db.customer.findUnique({
      where: { id: data.user.id },
      select: { role: true },
    });
    if (account?.role !== "admin") throw new Error("Not an administrator");
    if (action === "complete") await clearAdminGrant();
    return NextResponse.json(
      { authorized: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "This recovery session is invalid or does not belong to an administrator. Request a new recovery link.",
      },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
}
