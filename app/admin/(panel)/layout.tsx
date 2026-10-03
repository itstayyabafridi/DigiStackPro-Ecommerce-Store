import { requireAdminPage, adminPath } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { storefrontUrl } from "@/lib/site";
import { AdminShell } from "@/components/admin/shell";
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdminPage();
  const [settings, profile, pending, storeUrl] = await Promise.all([
    getSettings(),
    db.customer.findUnique({
      where: { id: user.id },
      select: { name: true, email: true },
    }),
    db.order.count({
      where: { status: "pending", paymentSubmittedAt: { not: null } },
    }),
    storefrontUrl(),
  ]);
  return (
    <AdminShell
      base={(await adminPath()).replace(/\/$/, "")}
      siteName={settings.siteName}
      userName={profile?.name || profile?.email || "Administrator"}
      pending={pending}
      storeUrl={storeUrl}
    >
      {children}
    </AdminShell>
  );
}
