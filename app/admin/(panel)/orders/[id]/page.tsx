import { AssetImage } from "@/components/asset-image";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { storage } from "@/lib/supabase";
import { buckets } from "@/lib/files";
import { uuid } from "@/lib/security";
import { money } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { OrderReview, AdminAction } from "@/components/admin-form";
export default async function OrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const id = uuid.safeParse((await params).id);
  if (!id.success) notFound();
  const o = await db.order.findUnique({
    where: { id: id.data },
    include: { items: true },
  });
  if (!o) notFound();
  const proof = o.paymentScreenshotUrl
    ? (
        await storage()
          .storage.from(buckets.screenshots)
          .createSignedUrl(o.paymentScreenshotUrl, 300)
      ).data?.signedUrl
    : null;
  return (
    <>
      <h1 className="page-title mb-7">Order {o.id.slice(0, 8)}</h1>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="block px-6">
          <h2 className="section-title">{o.name}</h2>
          <p className="mt-3">{o.email}</p>
          <p>{o.whatsapp}</p>
          <p className="my-4 capitalize">
            {o.paymentMethod} · {o.status}
          </p>
          {o.items.map((i) => (
            <p className="flex justify-between gap-3 border-t py-3" key={i.id}>
              <span>{i.title}</span>
              <span>{money(i.price)}</span>
            </p>
          ))}
          <p className="mt-4 font-semibold">
            Total {money(o.total)}{" "}
            {o.discount > 0 && `(discount ${money(o.discount)})`}
          </p>
          {o.adminNote && (
            <p className="mt-4 whitespace-pre-wrap">
              Admin note: {o.adminNote}
            </p>
          )}
          {o.status === "pending" && o.paymentSubmittedAt && (
            <OrderReview id={o.id} />
          )}
          {o.status === "approved" && (
            <div className="mt-5">
              <p className="mb-3 text-sm">
                {o.deliverySentAt
                  ? "Delivery email sent."
                  : (o.deliveryError ?? "Delivery email is pending.")}
              </p>
              {!o.deliverySentAt && (
                <AdminAction action="retry" data={{ id: o.id }}>
                  Retry delivery email
                </AdminAction>
              )}
            </div>
          )}
        </Card>
        <Card className="block px-6">
          <h2 className="section-title mb-4">Payment proof</h2>
          {proof ? (
            <a href={proof} target="_blank" rel="noreferrer">
              <AssetImage
                src={proof}
                alt="Customer payment screenshot"
                className="max-h-[650px] w-full object-contain"
              />
            </a>
          ) : (
            <p>No screenshot submitted.</p>
          )}
        </Card>
      </div>
    </>
  );
}
