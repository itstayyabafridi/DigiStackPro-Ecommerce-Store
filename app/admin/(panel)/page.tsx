import { requireAdminPage, adminPath } from "@/lib/auth";
import { getDashboard } from "@/lib/dashboard";
import { AdminDashboard } from "@/components/admin/dashboard";
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  await requireAdminPage();
  const value = (await searchParams).days;
  const days = value === "7" ? 7 : value === "90" ? 90 : 30;
  return (
    <AdminDashboard
      key={days}
      data={await getDashboard(days)}
      base={(await adminPath()).replace(/\/$/, "")}
    />
  );
}
