import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin, requestLimit, errorMessage } from "@/lib/security";
import { startFunnel, advanceFunnel } from "@/lib/funnels";
export async function POST(request: NextRequest) {
  try {
    await sameOrigin();
    await requestLimit("funnels", 100);
    const raw = await request.json();
    const input = z
      .object({
        slug: z.string().min(1).max(100),
        stepId: z.string().uuid().optional(),
        action: z.enum(["start", "accept", "decline", "checkout"]),
      })
      .parse(raw);
    if (input.action !== "start" && !input.stepId)
      throw new Error("Step is required.");
    const url =
      input.action === "start"
        ? await startFunnel(input.slug)
        : await advanceFunnel(input.slug, input.stepId!, input.action, raw);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 400 });
  }
}
