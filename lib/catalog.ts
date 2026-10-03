import "server-only";
import { db } from "./db";
import { databaseConfigured } from "./config";
export const publicProduct = {
  id: true,
  title: true,
  slug: true,
  description: true,
  price: true,
  thumbnailUrl: true,
  isFeatured: true,
  category: { select: { name: true, slug: true } },
} as const;
export async function catalog(categorySlug?: string) {
  if (!databaseConfigured()) return [];
  return db.product.findMany({
    where: {
      isPublished: true,
      archived: false,
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    },
    select: publicProduct,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });
}
