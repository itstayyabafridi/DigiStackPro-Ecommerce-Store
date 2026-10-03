import { databaseConfigured } from "./config";
import "server-only";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { db, transaction } from "./db";
import { token, hash, cookieOptions } from "./security";
import { checkoutSchema, buildOrder } from "./orders";
import { nextStep, type EditorStep } from "./funnel-schema";
export function editorSteps(
  steps: {
    id: string;
    type: EditorStep["type"];
    config: Prisma.JsonValue;
    productId: string | null;
    nextOnAccept: string | null;
    nextOnDecline: string | null;
  }[],
): EditorStep[] {
  return steps.map((s) => ({
    ...s,
    config: s.config as Record<string, unknown>,
  }));
}
export async function funnelSession(slug: string) {
  if (!databaseConfigured()) return null;
  const secret = (await cookies()).get("funnel")?.value;
  if (!secret) return null;
  return db.funnelSession.findFirst({
    where: {
      tokenHash: hash(secret),
      expiresAt: { gt: new Date() },
      funnel: { slug, status: "published" },
    },
    include: {
      funnel: {
        include: {
          steps: { where: { archived: false }, orderBy: { position: "asc" } },
        },
      },
    },
  });
}
function destination(
  slug: string,
  stepId: string | null,
  orderId?: string | null,
) {
  return stepId
    ? `/f/${slug}/${stepId}`
    : orderId
      ? `/checkout/${orderId}`
      : `/f/${slug}`;
}
export async function startFunnel(slug: string) {
  const existing = await funnelSession(slug);
  if (existing && existing.revision === existing.funnel.revision) {
    if (existing.orderId)
      (await cookies()).set(
        "checkout",
        hash(`${existing.tokenHash}:checkout`),
        cookieOptions,
      );
    return destination(slug, existing.currentStepId, existing.orderId);
  }
  const funnel = await db.funnel.findFirst({
    where: { slug, status: "published" },
    include: {
      steps: { where: { archived: false }, orderBy: { position: "asc" } },
    },
  });
  if (!funnel?.steps.length) throw new Error("This funnel is unavailable.");
  const secret = token();
  const session = await db.funnelSession.create({
    data: {
      tokenHash: hash(secret),
      funnelId: funnel.id,
      revision: funnel.revision,
      currentStepId: funnel.steps[0].id,
      expiresAt: new Date(Date.now() + 7 * 86400000),
    },
  });
  (await cookies()).set("funnel", secret, cookieOptions);
  return destination(slug, session.currentStepId);
}
export async function advanceFunnel(
  slug: string,
  stepId: string,
  action: "accept" | "decline" | "checkout",
  raw: unknown,
) {
  const session = await funnelSession(slug);
  if (!session)
    throw new Error("Session expired. Restart from the funnel entry page.");
  // Deterministic per session so a retried request can restore a lost Set-Cookie response.
  const checkoutSecret = hash(`${session.tokenHash}:checkout`);
  const result = await transaction(async (tx) => {
    const current = await tx.funnelSession.findUniqueOrThrow({
      where: { id: session.id },
      include: {
        order: true,
        funnel: {
          include: {
            steps: { where: { archived: false }, orderBy: { position: "asc" } },
          },
        },
      },
    });
    if (
      current.funnel.status !== "published" ||
      current.revision !== current.funnel.revision
    )
      throw new Error("This funnel changed. Restart from its entry page.");
    if (
      current.order &&
      (current.order.status !== "pending" || current.order.paymentSubmittedAt)
    )
      throw new Error("This order is already submitted.");
    if (current.currentStepId !== stepId)
      return {
        url: destination(slug, current.currentStepId, current.orderId),
        created: false,
      };
    const steps = editorSteps(current.funnel.steps);
    const step = steps.find((s) => s.id === stepId)!;
    if ((step.type === "checkout") !== (action === "checkout"))
      throw new Error("Invalid step action.");
    if (
      action === "decline" &&
      !["upsell", "downsell", "order_bump"].includes(step.type)
    )
      throw new Error("This step cannot be declined.");
    let orderId = current.orderId;
    let created = false;
    const selected = new Set(current.selectedProductIds);
    if (
      action !== "decline" &&
      step.productId &&
      ["checkout", "order_bump", "upsell", "downsell"].includes(step.type)
    )
      selected.add(step.productId);
    if (step.type === "checkout") {
      const input = checkoutSchema.parse({
        ...(raw as Record<string, unknown>),
        productIds: [...selected],
        coupon: "",
      });
      const order = await buildOrder(tx, input, checkoutSecret);
      orderId = order.id;
      created = true;
    } else if (
      orderId &&
      action === "accept" &&
      step.productId &&
      ["order_bump", "upsell", "downsell"].includes(step.type)
    ) {
      const p = await tx.product.findFirst({
        where: { id: step.productId, isPublished: true, archived: false },
      });
      if (!p) throw new Error("This offer is no longer available.");
      const exists = await tx.orderItem.findUnique({
        where: { orderId_productId: { orderId, productId: p.id } },
      });
      if (!exists) {
        await tx.orderItem.create({
          data: {
            orderId,
            productId: p.id,
            title: p.title,
            price: p.price,
            filePath: p.filePath,
          },
        });
        await tx.order.update({
          where: { id: orderId },
          data: {
            subtotal: { increment: p.price },
            total: { increment: p.price },
          },
        });
      }
    }
    const next = nextStep(
      steps,
      stepId,
      action === "decline" ? "decline" : "accept",
    );
    if (!next && !orderId) throw new Error("This path has no checkout.");
    await tx.funnelSession.update({
      where: { id: current.id },
      data: {
        currentStepId: next,
        selectedProductIds: [...selected],
        orderId,
        ...(created ? { checkoutStepId: stepId } : {}),
      },
    });
    await tx.funnelEvent.upsert({
      where: {
        sessionId_stepId_type: {
          sessionId: current.id,
          stepId,
          type: action === "decline" ? "decline" : "accept",
        },
      },
      create: {
        sessionId: current.id,
        stepId,
        type: action === "decline" ? "decline" : "accept",
      },
      update: {},
    });
    return { url: destination(slug, next, orderId), created };
  });
  (await cookies()).set("checkout", checkoutSecret, cookieOptions);
  return result.url;
}
