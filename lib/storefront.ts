import "server-only";
import { cache } from "react";
import { db } from "./db";
import { databaseConfigured } from "./config";
export const storeCategories = cache(async () => {
  if (!databaseConfigured()) return [];
  return db.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { products: { where: { isPublished: true, archived: false } } },
      },
      products: {
        where: { isPublished: true, archived: false },
        select: { thumbnailUrl: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });
});
