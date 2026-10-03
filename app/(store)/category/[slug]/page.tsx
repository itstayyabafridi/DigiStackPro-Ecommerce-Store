import { databaseConfigured } from "@/lib/config";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { catalog } from "@/lib/catalog";
import { siteUrl } from "@/lib/site";
import { StoreCatalog } from "@/components/store/catalog";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!databaseConfigured()) notFound();
  const { slug } = await params;
  const c = await db.category.findUnique({ where: { slug } });
  return {
    title: c?.name ?? "Category",
    alternates: { canonical: `${await siteUrl()}/category/${slug}` },
  };
}
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  if (!databaseConfigured()) notFound();
  const { slug } = await params;
  const c = await db.category.findUnique({ where: { slug } });
  if (!c) notFound();
  const q = (await searchParams).q;
  return (
    <StoreCatalog
      key={`${slug}:${typeof q === "string" ? q : ""}`}
      title={c.name}
      products={await catalog(slug)}
      query={typeof q === "string" ? q.slice(0, 120) : ""}
    />
  );
}
