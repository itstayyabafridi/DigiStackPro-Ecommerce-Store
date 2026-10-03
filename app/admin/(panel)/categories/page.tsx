import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminForm, AdminAction } from "@/components/admin-form";
import { Card } from "@/components/ui/card";
export default async function Categories() {
  await requireAdminPage();
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });
  const fields = [
    { name: "name", label: "Name", required: true },
    { name: "slug", label: "URL slug", required: true },
  ];
  return (
    <>
      <h1 className="page-title mb-8">Categories</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="block px-6">
          <h2 className="section-title mb-5">Add category</h2>
          <AdminForm action="category" fields={fields} />
        </Card>
        {categories.map((c) => (
          <Card className="block px-6" key={c.id}>
            <AdminForm action="category" fields={fields} initial={c} />
            <div className="mt-5">
              <AdminAction action="deleteCategory" data={c.id} destructive>
                Delete category
              </AdminAction>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
