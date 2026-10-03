import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { transaction } from "@/lib/db";
import { sameOrigin, errorMessage } from "@/lib/security";
import {
  funnelSchema,
  validateFunnel,
  configSchemas,
} from "@/lib/funnel-schema";
import { editorSteps } from "@/lib/funnels";
export async function POST(request: NextRequest) {
  try {
    await sameOrigin();
    await requireAdmin();
    const { action, data } = z
      .object({
        action: z.enum(["save", "publish", "unpublish"]),
        data: z.unknown(),
      })
      .parse(await request.json());
    const id = await transaction(async (tx) => {
      if (action !== "save") {
        const { id } = z.object({ id: z.string().uuid() }).parse(data);
        const f = await tx.funnel.findUniqueOrThrow({
          where: { id },
          include: {
            steps: { where: { archived: false }, orderBy: { position: "asc" } },
          },
        });
        if (action === "publish") {
          validateFunnel(editorSteps(f.steps));
          const ids = [
            ...new Set(
              f.steps.flatMap((s) => (s.productId ? [s.productId] : [])),
            ),
          ];
          if (
            (await tx.product.count({
              where: { id: { in: ids }, isPublished: true, archived: false },
            })) !== ids.length
          )
            throw new Error("All selected products must be published.");
        }
        await tx.funnel.update({
          where: { id },
          data: {
            status: action === "publish" ? "published" : "draft",
            revision: { increment: 1 },
          },
        });
        return id;
      }
      const input = funnelSchema.parse(data);
      for (const step of input.steps)
        configSchemas[step.type].parse(step.config);
      if (new Set(input.steps.map((s) => s.id)).size !== input.steps.length)
        throw new Error("Duplicate step IDs.");
      const existing = input.id
        ? await tx.funnel.findUniqueOrThrow({ where: { id: input.id } })
        : null;
      if (existing?.status === "published")
        throw new Error("Unpublish the funnel before editing its structure.");
      const f = existing
        ? await tx.funnel.update({
            where: { id: existing.id },
            data: {
              name: input.name,
              slug: input.slug,
              revision: { increment: 1 },
            },
          })
        : await tx.funnel.create({
            data: { name: input.name, slug: input.slug },
          });
      const foreign = await tx.funnelStep.count({
        where: {
          id: { in: input.steps.map((s) => s.id) },
          funnelId: { not: f.id },
        },
      });
      if (foreign) throw new Error("Invalid step ownership.");
      await tx.funnelStep.updateMany({
        where: { funnelId: f.id, id: { notIn: input.steps.map((s) => s.id) } },
        data: { archived: true },
      });
      for (const [position, step] of input.steps.entries()) {
        const values = {
          ...step,
          config: configSchemas[step.type].parse(
            step.config,
          ) as Prisma.InputJsonValue,
          position,
          funnelId: f.id,
          archived: false,
        };
        await tx.funnelStep.upsert({
          where: { id: step.id },
          create: values,
          update: values,
        });
      }
      return f.id;
    });
    revalidatePath("/", "layout");
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 400 });
  }
}
