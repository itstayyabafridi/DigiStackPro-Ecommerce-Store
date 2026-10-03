import { requireAdminPage } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { AdminForm, type Field } from "@/components/admin-form";
import { adminSecurity } from "@/lib/admin-security";
import { AdminSecurityForm } from "@/components/admin-security-form";
export default async function Settings() {
  await requireAdminPage();
  const s = await getSettings();
  const security = await adminSecurity();
  const fields: Field[] = [
    { name: "siteName", label: "Site name", required: true },
    { name: "logo", label: "Logo", type: "images" },
    { name: "favicon", label: "Favicon (PNG)", type: "images" },
    { name: "primaryColor", label: "Primary color", type: "color" },
    { name: "heroTitle", label: "Hero headline", required: true },
    { name: "heroDescription", label: "Hero description", type: "textarea" },
    { name: "whatsapp", label: "WhatsApp number" },
    { name: "contactEmail", label: "Contact email", type: "email" },
    {
      name: "easypaisa",
      label: "Easypaisa instructions (blank disables method)",
      type: "textarea",
    },
    {
      name: "jazzcash",
      label: "JazzCash instructions (blank disables method)",
      type: "textarea",
    },
    {
      name: "bank",
      label: "Bank transfer instructions (blank disables method)",
      type: "textarea",
    },
    { name: "seoTitle", label: "Default SEO title" },
    {
      name: "seoDescription",
      label: "Default SEO description",
      type: "textarea",
    },
  ];
  return (
    <div className="max-w-2xl">
      <h1 className="page-title mb-8">Store settings</h1>
      <AdminSecurityForm enabled={security.emailVerificationEnabled} />
      <AdminForm action="settings" fields={fields} initial={s} />
    </div>
  );
}
