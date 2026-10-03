import "server-only";
import { db } from "./db";
import { dashboardMetrics, reportingWindow } from "./dashboard-metrics";
export async function getDashboard(days: number) {
  const now = new Date();
  const { previousStart, end } = reportingWindow(days, now);
  const orders = await db.order.findMany({
    where: {
      createdAt: { gte: previousStart, lt: end },
      paymentSubmittedAt: { not: null },
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      total: true,
      subtotal: true,
      createdAt: true,
      items: {
        select: {
          title: true,
          price: true,
          productId: true,
          product: { select: { title: true, thumbnailUrl: true } },
        },
      },
    },
  });
  return dashboardMetrics(orders, days, now);
}
