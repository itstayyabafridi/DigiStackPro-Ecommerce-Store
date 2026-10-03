export type DashboardOrder = {
  id: string;
  name: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  total: number;
  subtotal: number;
  createdAt: Date;
  items: {
    title: string;
    price: number;
    productId: string;
    product: { title: string; thumbnailUrl: string };
  }[];
};
export function reportingWindow(days: number, now = new Date()) {
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  const start = new Date(end.getTime() - days * 86400000);
  const previousStart = new Date(start.getTime() - days * 86400000);
  return { start, end, previousStart };
}
export function changePercent(current: number, previous: number) {
  return previous === 0
    ? null
    : Math.round(((current - previous) / previous) * 1000) / 10;
}
export function dashboardMetrics(
  orders: DashboardOrder[],
  days: number,
  now = new Date(),
) {
  const { start, end } = reportingWindow(days, now);
  const current = orders.filter(
    (o) => o.createdAt >= start && o.createdAt < end,
  );
  const previous = orders.filter(
    (o) =>
      o.createdAt < start &&
      o.createdAt >= new Date(start.getTime() - days * 86400000),
  );
  const totals = (rows: DashboardOrder[]) => ({
    sales: rows
      .filter((o) => o.status === "approved")
      .reduce((sum, o) => sum + o.total, 0),
    orders: rows.length,
    customers: new Set(rows.map((o) => o.email.toLowerCase())).size,
    pending: rows.filter((o) => o.status === "pending").length,
  });
  const stats = totals(current),
    prior = totals(previous);
  const series = Array.from({ length: days }, (_, i) => {
    const date = new Date(start.getTime() + i * 86400000);
    const rows = current.filter(
      (o) =>
        o.createdAt.toISOString().slice(0, 10) ===
        date.toISOString().slice(0, 10),
    );
    return { date: date.toISOString().slice(0, 10), ...totals(rows) };
  });
  const products = new Map<
    string,
    {
      id: string;
      title: string;
      thumbnailUrl: string;
      orders: number;
      revenue: number;
    }
  >();
  for (const o of current.filter((o) => o.status === "approved")) {
    // Allocate order-level discounts proportionally, keeping the total exact in integer paisa.
    let allocated = 0;
    o.items.forEach((item, index) => {
      const amount =
        index === o.items.length - 1
          ? o.total - allocated
          : Math.floor((o.total * item.price) / o.subtotal);
      allocated += amount;
      const p = products.get(item.productId) ?? {
        id: item.productId,
        title: item.product.title,
        thumbnailUrl: item.product.thumbnailUrl,
        orders: 0,
        revenue: 0,
      };
      p.orders++;
      p.revenue += amount;
      products.set(item.productId, p);
    });
  }
  return {
    days,
    stats,
    changes: {
      sales: changePercent(stats.sales, prior.sales),
      orders: changePercent(stats.orders, prior.orders),
      customers: changePercent(stats.customers, prior.customers),
      pending: changePercent(stats.pending, prior.pending),
    },
    series,
    products: [...products.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5),
    recent: current
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map((o) => ({
        id: o.id,
        name: o.name,
        total: o.total,
        status: o.status,
        products: o.items.map((i) => i.title).join(", "),
      })),
  };
}
export type DashboardData = ReturnType<typeof dashboardMetrics>;
