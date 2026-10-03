import { databaseConfigured } from "@/lib/config";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { FunnelAction } from "@/components/funnel-step";
import { siteUrl } from "@/lib/site";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ funnelSlug: string }>;
}) {
  if (!databaseConfigured()) notFound();
  const { funnelSlug } = await params;
  const f = await db.funnel.findFirst({
    where: { slug: funnelSlug, status: "published" },
  });
  return {
    title: f?.name ?? "Collection",
    alternates: { canonical: `${await siteUrl()}/f/${funnelSlug}` },
  };
}
export default async function FunnelEntry({
  params,
}: {
  params: Promise<{ funnelSlug: string }>;
}) {
  if (!databaseConfigured()) notFound();
  const { funnelSlug } = await params;
  const f = await db.funnel.findFirst({
    where: { slug: funnelSlug, status: "published" },
    include: {
      steps: {
        where: { archived: false },
        orderBy: { position: "asc" },
        take: 1,
      },
    },
  });
  if (!f) notFound();
  const config = f.steps[0]?.config as { heading?: string; body?: string };
  return (
    <section className="container max-w-2xl py-20">
      <h1 className="page-title">{config?.heading ?? f.name}</h1>
      <p className="prose-copy my-7">{config?.body ?? ""}</p>
      <FunnelAction slug={f.slug} action="start">
        Get started
      </FunnelAction>
    </section>
  );
}
