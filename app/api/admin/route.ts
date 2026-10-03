import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db, transaction } from "@/lib/db";
import { sameOrigin, uuid, errorMessage } from "@/lib/security";
import {
  productSchema,
  categorySchema,
  couponSchema,
} from "@/lib/admin-schemas";
import { settingsSchema } from "@/lib/settings";
import { storage } from "@/lib/supabase";
import { buckets } from "@/lib/files";
import { deliverOrder } from "@/lib/delivery";
export async function POST(request: NextRequest) {
  try {
    await sameOrigin();
    await requireAdmin();
    const { action, data } = z
      .object({
        action: z.enum([
          "product",
          "archive",
          "category",
          "deleteCategory",
          "coupon",
          "deleteCoupon",
          "settings",
          "approve",
          "reject",
          "retry",
        ]),
        data: z.unknown(),
      })
      .parse(await request.json());
    if (action === "product") {
      const { id, categoryId, ...values } = productSchema.parse(data);
      const { error } = await storage()
        .storage.from(buckets.products)
        .info(values.filePath);
      if (error) throw new Error("Upload a valid product file first.");
      const thumb = new URL(values.thumbnailUrl);
      const base = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
      if (
        thumb.origin !== base.origin ||
        !thumb.pathname.startsWith(
          `/storage/v1/object/public/${buckets.images}/`,
        )
      )
        throw new Error("Upload the thumbnail to the store image bucket.");
      const payload = { ...values, categoryId: categoryId || null };
      if (id) await db.product.update({ where: { id }, data: payload });
      else await db.product.create({ data: payload });
    } else if (action === "archive") {
      const id = uuid.parse(data);
      await db.product.update({
        where: { id },
        data: { archived: true, isPublished: false },
      });
    } else if (action === "category") {
      const { id, ...values } = categorySchema.parse(data);
      if (id) await db.category.update({ where: { id }, data: values });
      else await db.category.create({ data: values });
    } else if (action === "deleteCategory")
      await db.category.delete({ where: { id: uuid.parse(data) } });
    else if (action === "coupon") {
      const { id, startsAt, expiresAt, limit, ...values } =
        couponSchema.parse(data);
      const payload = {
        ...values,
        value:
          values.kind === "fixed"
            ? Math.round(values.value * 100)
            : values.value,
        startsAt: startsAt ? new Date(`${startsAt}Z`) : null,
        expiresAt: expiresAt ? new Date(`${expiresAt}Z`) : null,
        limit: limit || null,
      };
      if (id) {
        const referenced = await db.order.count({ where: { couponId: id } });
        if (referenced) {
          const original = await db.coupon.findUniqueOrThrow({ where: { id } });
          if (
            original.kind !== payload.kind ||
            original.value !== payload.value ||
            original.minimum !== payload.minimum ||
            original.code !== payload.code
          )
            throw new Error(
              "This coupon has orders. Create a new code to change its discount terms.",
            );
        }
        await db.coupon.update({ where: { id }, data: payload });
      } else await db.coupon.create({ data: payload });
    } else if (action === "deleteCoupon") {
      const id = uuid.parse(data);
      if (await db.order.count({ where: { couponId: id } }))
        await db.coupon.update({ where: { id }, data: { active: false } });
      else await db.coupon.delete({ where: { id } });
    } else if (action === "settings") {
      const values = settingsSchema.parse(data);
      await db.setting.upsert({
        where: { key: "site" },
        create: { key: "site", value: values },
        update: { value: values },
      });
    } else {
      const { id, note } = z
        .object({ id: uuid, note: z.string().max(2000).default("") })
        .parse(data);
      if (action === "retry") {
        await deliverOrder(id);
      } else {
        await transaction(async (tx) => {
          const changed = await tx.order.updateMany({
            where: {
              id,
              status: "pending",
              paymentSubmittedAt: { not: null },
              paymentScreenshotUrl: { not: null },
            },
            data: {
              status: action === "approve" ? "approved" : "rejected",
              adminNote: note,
            },
          });
          if (!changed.count)
            throw new Error(
              "Order is already reviewed or has no payment proof.",
            );
          if (action === "approve") {
            const session = await tx.funnelSession.findUnique({
              where: { orderId: id },
            });
            if (session?.checkoutStepId)
              await tx.funnelEvent.upsert({
                where: {
                  sessionId_stepId_type: {
                    sessionId: session.id,
                    stepId: session.checkoutStepId,
                    type: "purchase",
                  },
                },
                create: {
                  sessionId: session.id,
                  stepId: session.checkoutStepId,
                  type: "purchase",
                },
                update: {},
              });
          }
        });
        if (action === "approve") await deliverOrder(id);
      }
    }
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
