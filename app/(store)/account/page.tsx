import { currentUser, claimOrders } from "@/lib/auth";
import { db } from "@/lib/db";
import { Login, Logout } from "@/components/login";
import { Card } from "@/components/ui/card";
import { money } from "@/lib/utils";
export const metadata = {
  title: "My Orders",
  robots: { index: false, follow: false },
};
export default async function AccountPage() {
  const user = await currentUser();
  if (!user)
    return (
      <section className="container max-w-lg py-14">
        <h1 className="page-title mb-4">Your downloads, together.</h1>
        <p className="mb-8 text-slate-500">
          Enter the email you used at checkout. We’ll send a code so you can
          view your orders.
        </p>
        <Login />
      </section>
    );
  const customer = await claimOrders();
  const orders = await db.order.findMany({
    where: { customerId: customer.id, paymentSubmittedAt: { not: null } },
    include: { items: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <section className="container max-w-3xl py-14">
      <div className="mb-8 flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="page-title">My Orders</h1>
          <p className="mt-3 text-slate-500">{customer.email}</p>
        </div>
        <Logout />
      </div>
      <div className="space-y-5">
        {orders.map((o) => (
          <Card className="block px-6" key={o.id}>
            <div className="flex flex-wrap justify-between gap-4">
              <p className="font-semibold">Order {o.id.slice(0, 8)}</p>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm capitalize">
                {o.status}
              </span>
            </div>
            <p className="my-3 text-sm text-slate-500">
              {o.createdAt.toLocaleDateString("en-PK")} · {money(o.total)}
            </p>
            <ul className="space-y-3">
              {o.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4">
                  <span>{i.title}</span>
                  {o.status === "approved" && (
                    <a
                      className="font-semibold text-primary underline"
                      href={`/api/download/${i.id}`}
                    >
                      Download
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        ))}
        {!orders.length && <p>No submitted orders found for this email.</p>}
      </div>
    </section>
  );
}
