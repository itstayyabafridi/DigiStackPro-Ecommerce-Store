import { notFound, redirect } from "next/navigation";
import { guestOrder } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { money } from "@/lib/utils";
import { PaymentUpload, NewCheckout } from "@/components/checkout";
import { Card } from "@/components/ui/card";
import { uuid } from "@/lib/security";
export const metadata = {
  title: "Payment",
  robots: { index: false, follow: false },
};
export default async function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = uuid.safeParse((await params).id);
  if (!id.success) notFound();
  const order = await guestOrder(id.data).catch(() => null);
  if (!order) notFound();
  if (order.funnelSession?.currentStepId) {
    const { db } = await import("@/lib/db");
    const funnel = await db.funnel.findUniqueOrThrow({
      where: { id: order.funnelSession.funnelId },
    });
    redirect(`/f/${funnel.slug}/${order.funnelSession.currentStepId}`);
  }
  const s = await getSettings();
  return (
    <section className="container max-w-2xl py-14">
      <h1 className="page-title mb-3">
        {order.paymentSubmittedAt ? "Payment submitted." : "One last step."}
      </h1>
      <p className="mb-8 text-slate-500">
        Order {order.id.slice(0, 8)} · {order.email}
      </p>
      <Card className="block px-6">
        <ul className="space-y-3">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-5">
              <span>{i.title}</span>
              <span>{money(i.price)}</span>
            </li>
          ))}
        </ul>
        {order.discount > 0 && (
          <p className="mt-5 flex justify-between">
            <span>Discount</span>
            <span>−{money(order.discount)}</span>
          </p>
        )}
        <p className="mt-5 flex justify-between border-t pt-5 text-xl font-semibold">
          <span>Total</span>
          <span>{money(order.total)}</span>
        </p>
      </Card>
      {order.paymentSubmittedAt ? (
        <div className="my-8 space-y-5">
          <p>
            {order.status === "approved"
              ? "Approved! Check your email or My Orders for downloads."
              : order.status === "rejected"
                ? "Payment was rejected. Contact the store if you need help."
                : "We’ll review your payment and email your downloads after approval."}
          </p>
          <NewCheckout />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <h2 className="section-title">
            Pay by{" "}
            {order.paymentMethod === "bank"
              ? "bank transfer"
              : order.paymentMethod === "easypaisa"
                ? "Easypaisa"
                : "JazzCash"}
          </h2>
          <p className="prose-copy rounded-lg bg-slate-50 p-5">
            {s[order.paymentMethod as "bank"]}
          </p>
          <h2 className="font-semibold">Upload your payment screenshot</h2>
          <p className="text-sm text-slate-500">
            Uploading submits this order for review. Make sure the paid amount
            matches the total above.
          </p>
          <PaymentUpload orderId={order.id} />
          <NewCheckout />
        </div>
      )}
    </section>
  );
}
