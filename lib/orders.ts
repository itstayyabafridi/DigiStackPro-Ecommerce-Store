import "server-only";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db, transaction } from "./db";
import { hash, guestToken } from "./security";
import { discountFor } from "./pricing";
import { getSettings } from "./settings";
export const checkoutSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{7,25}$/),
  paymentMethod: z.enum(["easypaisa", "jazzcash", "bank"]),
  productIds: z.array(z.string().uuid()).min(1).max(50),
  coupon: z
    .string()
    .trim()
    .max(40)
    .transform((v) => v.toUpperCase())
    .default(""),
});
export async function buildOrder(
  tx: Prisma.TransactionClient,
  input: z.infer<typeof checkoutSchema>,
  secret: string,
) {
  const settings = await getSettings();
  if (!settings[input.paymentMethod])
    throw new Error("This payment method has not been configured.");
  const ids = [...new Set(input.productIds)];
  const products = await tx.product.findMany({
    where: { id: { in: ids }, isPublished: true, archived: false },
  });
  if (products.length !== ids.length)
    throw new Error("One or more products are no longer available.");
  const subtotal = products.reduce((sum, p) => sum + p.price, 0);
  if (subtotal > 2000000000)
    throw new Error("Order total exceeds the supported limit.");
  const coupon = input.coupon
    ? await tx.coupon.findUnique({ where: { code: input.coupon } })
    : null;
  if (input.coupon && !coupon) throw new Error("Coupon not found.");
  const used = coupon
    ? await tx.order.count({
        where: {
          couponId: coupon.id,
          status: { not: "rejected" },
          paymentSubmittedAt: { not: null },
        },
      })
    : 0;
  const discount = discountFor(subtotal, coupon, used);
  return tx.order.create({
    data: {
      name: input.name,
      email: input.email,
      whatsapp: input.whatsapp,
      paymentMethod: input.paymentMethod,
      subtotal,
      discount,
      total: subtotal - discount,
      couponId: coupon?.id,
      checkoutTokenHash: hash(secret),
      items: {
        create: products.map((p) => ({
          productId: p.id,
          title: p.title,
          price: p.price,
          filePath: p.filePath,
        })),
      },
    },
  });
}
export async function checkoutOrder(
  input: z.infer<typeof checkoutSchema>,
  secret: string,
) {
  try {
    return await transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { checkoutTokenHash: hash(secret) },
      });
      return existing ?? buildOrder(tx, input, secret);
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await db.order.findUnique({
        where: { checkoutTokenHash: hash(secret) },
      });
      if (existing) return existing;
    }
    throw error;
  }
}
export async function guestOrder(id: string) {
  const secret = await guestToken();
  if (!secret) throw new Error("This checkout session has expired.");
  const order = await db.order.findFirst({
    where: { id, checkoutTokenHash: hash(secret) },
    include: { items: true, funnelSession: true },
  });
  if (!order) throw new Error("Order not found.");
  return order;
}
export async function submitProof(id: string, path: string) {
  const order = await guestOrder(id);
  await transaction(async (tx) => {
    const current = await tx.order.findUniqueOrThrow({
      where: { id },
      include: { coupon: true, funnelSession: true },
    });
    if (current.status !== "pending" || current.paymentSubmittedAt)
      throw new Error("This order is already submitted.");
    if (current.funnelSession?.currentStepId)
      throw new Error("Finish your offers before submitting payment.");
    const used = current.coupon
      ? await tx.order.count({
          where: {
            couponId: current.couponId,
            status: { not: "rejected" },
            paymentSubmittedAt: { not: null },
          },
        })
      : 0;
    const discount = discountFor(current.subtotal, current.coupon, used);
    if (discount !== current.discount)
      throw new Error(
        "The discount changed. Start a new checkout before paying.",
      );
    await tx.order.update({
      where: { id: order.id },
      data: { paymentScreenshotUrl: path, paymentSubmittedAt: new Date() },
    });
  });
}
