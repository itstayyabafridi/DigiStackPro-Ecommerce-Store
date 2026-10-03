import { notFound } from "next/navigation";
import { requireAdminPage, adminPath } from "@/lib/auth";
import { db } from "@/lib/db";
import { uuid } from "@/lib/security";
import { AdminForm } from "@/components/admin-form";
export default async function ProductEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  if (id !== "new" && !uuid.safeParse(id).success) notFound();
  const p =
    id === "new" ? null : await db.product.findUnique({ where: { id } });
  if (id !== "new" && !p) notFound();
  const categories = await db.category.findMany();
  return (
    <div className="max-w-2xl">
      <h1 className="page-title mb-8">{p ? "Edit product" : "New product"}</h1>
      <AdminForm
        action="product"
        returnTo={await adminPath("/products")}
        initial={
          p
            ? { ...p, price: p.price / 100, categoryId: p.categoryId ?? "" }
            : {
                price: 0,
                isPublished: false,
                isFeatured: false,
                categoryId: "",
              }
        }
        fields={[
          { name: "title", label: "Title", required: true },
          { name: "slug", label: "URL slug", required: true },
          {
            name: "description",
            label: "Description",
            type: "textarea",
            required: true,
          },
          {
            name: "price",
            label: "Price (PKR)",
            type: "number",
            required: true,
          },
          {
            name: "categoryId",
            label: "Category",
            type: "select",
            options: [
              { value: "", label: "Uncategorized" },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ],
          },
          {
            name: "thumbnailUrl",
            label: "Thumbnail",
            type: "images",
            required: true,
          },
          {
            name: "filePath",
            label: "Downloadable file",
            type: "products",
            required: true,
          },
          { name: "isPublished", label: "Published", type: "checkbox" },
          { name: "isFeatured", label: "Featured", type: "checkbox" },
        ]}
      />
    </div>
  );
}
