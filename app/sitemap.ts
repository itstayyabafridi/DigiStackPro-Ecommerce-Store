import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/site";
import { headers } from "next/headers";
import { isAdminHost } from "@/lib/routing";
import { databaseConfigured } from "@/lib/config";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (isAdminHost((await headers()).get("host") ?? "")) return [];
  const base = await siteUrl();
  if (!databaseConfigured()) return [{ url: base }];
  const [products, categories, funnels] = await Promise.all([
    db.product.findMany({
      where: { isPublished: true, archived: false },
      select: { slug: true },
    }),
    db.category.findMany({ select: { slug: true } }),
    db.funnel.findMany({
      where: { status: "published" },
      select: { slug: true },
    }),
  ]);
  return [
    { url: base },
    { url: `${base}/browse` },
    ...products.map((p) => ({ url: `${base}/products/${p.slug}` })),
    ...categories.map((c) => ({ url: `${base}/category/${c.slug}` })),
    ...funnels.map((f) => ({ url: `${base}/f/${f.slug}` })),
  ];
}
