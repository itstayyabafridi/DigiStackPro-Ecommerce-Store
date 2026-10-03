import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/security";
export async function POST() {
  await sameOrigin();
  (await cookies()).delete("checkout");
  return NextResponse.json({ ok: true });
}
