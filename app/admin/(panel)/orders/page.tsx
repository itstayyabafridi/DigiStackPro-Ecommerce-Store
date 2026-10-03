import Link from "next/link";
import { requireAdminPage, adminPath } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/utils";
import { Card } from "@/components/ui/card";
export default async function Orders({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireAdminPage();
  const query = await searchParams;
  const status = ["pending", "approved", "rejected"].includes(
    query.status ?? "",
  )
    ? (query.status as "pending" | "approved" | "rejected")
    : undefined;
  const page = Math.max(1, Math.min(100000, Number(query.page) || 1));
  const orders = await db.order.findMany({
    where: { status, paymentSubmittedAt: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 30,
    skip: (page - 1) * 30,
  });
  const base = await adminPath("/orders");
  return (
    <>
      <h1 className="page-title mb-7">Orders</h1>
      <nav className="mb-6 flex flex-wrap gap-5 text-sm">
        {["all", "pending", "approved", "rejected"].map((s) => (
          <Link
            key={s}
            className="capitalize underline"
            href={`${base}?status=${s}`}
          >
            {s}
          </Link>
        ))}
      </nav>
      <div className="space-y-3">
        {orders.map((o) => (
          <Card className="block px-6" key={o.id}>
            <Link
              className="flex flex-wrap justify-between gap-4"
              href={`${base}/${o.id}`}
            >
              <span>
                <strong>{o.name}</strong>
                <span className="mt-1 block text-sm text-slate-500">
                  {o.email} · {o.id.slice(0, 8)}
                </span>
              </span>
              <span>
                {money(o.total)}
                <span className="mt-1 block text-right text-sm capitalize text-slate-500">
                  {o.status}
                </span>
              </span>
            </Link>
          </Card>
        ))}
        {!orders.length && <p>No orders to show.</p>}
      </div>
      <div className="mt-6 flex gap-5">
        {page > 1 && (
          <Link href={`${base}?status=${status ?? "all"}&page=${page - 1}`}>
            Previous
          </Link>
        )}
        {orders.length === 30 && (
          <Link href={`${base}?status=${status ?? "all"}&page=${page + 1}`}>
            Next
          </Link>
        )}
      </div>
    </>
  );
}
