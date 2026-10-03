import { NextResponse } from "next/server";
import { authClient } from "@/lib/supabase";
import { sameOrigin } from "@/lib/security";
import { clearAdminGrant } from "@/lib/admin-security";
export async function POST() {
  await sameOrigin();
  await (await authClient()).auth.signOut({ scope: "local" });
  await clearAdminGrant();
  return NextResponse.json({ ok: true });
}
