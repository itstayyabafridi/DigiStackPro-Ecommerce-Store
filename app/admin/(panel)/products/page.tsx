import Link from "next/link";
import { requireAdminPage, adminPath } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdminAction } from "@/components/admin-form";
export default async function Products() {
  await requireAdminPage();
  const products = await db.product.findMany({
    where: { archived: false },
    orderBy: { createdAt: "desc" },
  });
  const base = await adminPath("/products");
  return (
    <>
      <div className="mb-8 flex justify-between gap-4">
        <h1 className="page-title">Products</h1>
        <Button asChild>
          <Link href={`${base}/new`}>Add product</Link>
        </Button>
      </div>
      <div className="space-y-3">
        {products.map((p) => (
          <Card
            key={p.id}
            className="px-6 flex-row flex flex-wrap items-center justify-between gap-5"
          >
            <div>
              <Link
                href={`${base}/${p.id}`}
                className="font-semibold underline"
              >
                {p.title}
              </Link>
              <p className="mt-1 text-sm text-slate-500">
                {money(p.price)} · {p.isPublished ? "Published" : "Draft"}
              </p>
            </div>
            <AdminAction action="archive" data={p.id} destructive>
              Archive
            </AdminAction>
          </Card>
        ))}
        {!products.length && <p>Add your first downloadable product.</p>}
      </div>
    </>
  );
}
