import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { funnelSession } from "@/lib/funnels";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { FunnelStepView } from "@/components/funnel-step";
export const metadata = { robots: { index: false, follow: false } };
export default async function FunnelStepPage({
  params,
}: {
  params: Promise<{ funnelSlug: string; stepId: string }>;
}) {
  const { funnelSlug, stepId } = await params;
  const session = await funnelSession(funnelSlug);
  if (!session) redirect(`/f/${funnelSlug}`);
  if (session.revision !== session.funnel.revision)
    return (
      <section className="container py-20">
        <h1 className="page-title">This collection has changed.</h1>
        <Link className="mt-5 inline-block underline" href={`/f/${funnelSlug}`}>
          Restart your selection
        </Link>
      </section>
    );
  if (!session.currentStepId && session.orderId)
    redirect(`/checkout/${session.orderId}`);
  if (session.currentStepId !== stepId)
    redirect(`/f/${funnelSlug}/${session.currentStepId}`);
  const step = session.funnel.steps.find((s) => s.id === stepId);
  if (!step) notFound();
  await db.funnelEvent.upsert({
    where: {
      sessionId_stepId_type: { sessionId: session.id, stepId, type: "view" },
    },
    create: { sessionId: session.id, stepId, type: "view" },
    update: {},
  });
  const product = step.productId
    ? await db.product.findUnique({
        where: { id: step.productId },
        select: { title: true, price: true, thumbnailUrl: true },
      })
    : null;
  const s = await getSettings();
  const methods = [
    { value: "easypaisa", label: "Easypaisa" },
    { value: "jazzcash", label: "JazzCash" },
    { value: "bank", label: "Bank transfer" },
  ].filter((m) => s[m.value as "bank"]);
  return (
    <section className="container max-w-2xl py-14">
      <FunnelStepView
        type={step.type}
        config={step.config as Record<string, unknown>}
        slug={funnelSlug}
        stepId={step.id}
        methods={methods}
        product={product}
      />
    </section>
  );
}
