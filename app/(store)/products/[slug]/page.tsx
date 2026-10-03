import { databaseConfigured } from "@/lib/config";
import { AssetImage } from "@/components/asset-image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { publicProduct } from "@/lib/catalog";
import { siteUrl } from "@/lib/site";
import { money } from "@/lib/utils";
import { AddToCart } from "@/components/cart";
async function product(slug: string) {
  if (!databaseConfigured()) return null;
  return db.product.findFirst({
    where: { slug, isPublished: true, archived: false },
    select: publicProduct,
  });
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = await product((await params).slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.description.slice(0, 160),
    alternates: { canonical: `${await siteUrl()}/products/${p.slug}` },
    openGraph: { title: p.title, images: [p.thumbnailUrl] },
  };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = await product((await params).slug);
  if (!p) notFound();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: p.description,
    image: p.thumbnailUrl,
    offers: {
      "@type": "Offer",
      price: (p.price / 100).toFixed(2),
      priceCurrency: "PKR",
      availability: "https://schema.org/InStock",
      url: `${await siteUrl()}/products/${p.slug}`,
    },
  };
  return (
    <section className="container grid gap-12 py-14 md:grid-cols-2">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
      <AssetImage
        src={p.thumbnailUrl}
        alt={p.title}
        className="aspect-[4/3] w-full rounded-xl object-cover"
      />
      <div>
        <p className="mb-3 text-sm text-slate-500">
          {p.category?.name ?? "Digital resource"}
        </p>
        <h1 className="page-title">{p.title}</h1>
        <p className="my-6 text-2xl font-semibold text-primary">
          {money(p.price)}
        </p>
        <p className="prose-copy mb-8">{p.description}</p>
        <AddToCart
          product={{
            id: p.id,
            title: p.title,
            slug: p.slug,
            price: p.price,
            thumbnailUrl: p.thumbnailUrl,
          }}
        />
        <p className="mt-5 text-sm text-slate-500">
          Digital download. Delivered after manual payment approval.
        </p>
      </div>
    </section>
  );
}
