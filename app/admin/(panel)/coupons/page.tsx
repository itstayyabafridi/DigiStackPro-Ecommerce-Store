import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminForm, AdminAction, type Field } from "@/components/admin-form";
import { Card } from "@/components/ui/card";
const fields: Field[] = [
  { name: "code", label: "Code", required: true },
  {
    name: "kind",
    label: "Discount type",
    type: "select",
    options: [
      { value: "percent", label: "Percentage" },
      { value: "fixed", label: "Fixed PKR" },
    ],
  },
  {
    name: "value",
    label: "Discount value (% or PKR)",
    type: "number",
    required: true,
  },
  { name: "minimum", label: "Minimum order (PKR)", type: "number" },
  { name: "startsAt", label: "Starts (UTC)", type: "datetime-local" },
  { name: "expiresAt", label: "Expires (UTC)", type: "datetime-local" },
  { name: "limit", label: "Usage limit (blank for unlimited)", type: "number" },
  { name: "active", label: "Active", type: "checkbox" },
];
export default async function Coupons() {
  await requireAdminPage();
  const coupons = await db.coupon.findMany({ orderBy: { code: "asc" } });
  return (
    <>
      <h1 className="page-title mb-8">Coupons</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="block px-6">
          <h2 className="section-title mb-5">New coupon</h2>
          <AdminForm
            action="coupon"
            fields={fields}
            initial={{ kind: "percent", minimum: 0, active: true }}
          />
        </Card>
        {coupons.map((c) => (
          <Card className="block px-6" key={c.id}>
            <AdminForm
              action="coupon"
              fields={fields}
              initial={{
                ...c,
                value: c.kind === "fixed" ? c.value / 100 : c.value,
                minimum: c.minimum / 100,
                limit: c.limit ?? "",
                startsAt: c.startsAt?.toISOString().slice(0, 16) ?? "",
                expiresAt: c.expiresAt?.toISOString().slice(0, 16) ?? "",
              }}
            />
            <div className="mt-4">
              <AdminAction action="deleteCoupon" data={c.id} destructive>
                Delete or deactivate
              </AdminAction>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
