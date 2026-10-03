import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import "./globals.css";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: {
      default: `${s.siteName} — ${s.seoTitle}`,
      template: `%s | ${s.siteName}`,
    },
    description: s.seoDescription,
    icons: { icon: s.favicon || "/brand-icon.svg" },
  };
}
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  return (
    <html lang="en">
      <body
        style={{ "--primary": settings.primaryColor } as React.CSSProperties}
      >
        {children}
      </body>
    </html>
  );
}
