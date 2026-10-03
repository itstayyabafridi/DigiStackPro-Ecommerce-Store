import "server-only";
import { Resend } from "resend";
import { db } from "./db";
import { signedFile } from "./files";
import { getSettings } from "./settings";
import { money } from "./utils";
export async function deliverOrder(id: string) {
  const acquired = await db.order.updateMany({
    where: {
      id,
      status: "approved",
      deliverySentAt: null,
      OR: [
        { deliveryLeaseAt: null },
        { deliveryLeaseAt: { lt: new Date(Date.now() - 120000) } },
      ],
    },
    data: { deliveryLeaseAt: new Date() },
  });
  if (!acquired.count) return;
  try {
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM)
      throw new Error("Resend is not configured.");
    let order = await db.order.findUniqueOrThrow({
      where: { id },
      include: { items: true },
    });
    // Persist the exact payload so retries reuse both content and idempotency key.
    if (
      !order.deliveryPayload ||
      !order.deliveryAttemptAt ||
      Date.now() - order.deliveryAttemptAt.getTime() > 23 * 3600000
    ) {
      const settings = await getSettings();
      const links = await Promise.all(
        order.items.map(
          async (item) => `${item.title}\n${await signedFile(item.filePath)}`,
        ),
      );
      const text = `Hi ${order.name},\n\nYour payment of ${money(order.total)} has been approved.\n\n${links.join("\n\n")}\n\nThese download links expire 24 hours after they are generated. Visit My Orders on the store and verify your email for fresh links.\n\n${settings.siteName}`;
      order = await db.order.update({
        where: { id },
        data: {
          deliveryPayload: {
            text,
            subject: `Your downloads from ${settings.siteName}`,
          },
          deliveryAttemptAt: new Date(),
          deliveryVersion: { increment: 1 },
        },
        include: { items: true },
      });
    }
    const payload = order.deliveryPayload as { subject: string; text: string };
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send(
      {
        from: process.env.RESEND_FROM!,
        to: order.email,
        subject: payload.subject,
        text: payload.text,
      },
      { idempotencyKey: `order-${id}-${order.deliveryVersion}` },
    );
    if (error) throw new Error(error.message);
    await db.order.update({
      where: { id },
      data: {
        deliverySentAt: new Date(),
        deliveryError: null,
        deliveryLeaseAt: null,
      },
    });
  } catch (error) {
    console.error("Delivery failed", error);
    await db.order.update({
      where: { id },
      data: {
        deliveryError: "Delivery failed. Check email configuration and retry.",
        deliveryLeaseAt: null,
      },
    });
  }
}
