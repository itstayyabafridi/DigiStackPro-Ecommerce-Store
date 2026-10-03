import Link from "next/link";
import { Layers, ArrowUpRight } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { storeCategories } from "@/lib/storefront";
import { StoreHeader } from "@/components/store/header";
import s from "@/components/store/store.module.css";
export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, categories] = await Promise.all([
    getSettings(),
    storeCategories(),
  ]);
  return (
    <div className={s.store}>
      <div className={s.frame}>
        <a href="#main" className={s.skip}>
          Skip to content
        </a>
        <StoreHeader
          siteName={settings.siteName}
          logo={settings.logo}
          categories={categories}
        />
        <main id="main">{children}</main>
        <footer className={s.footer}>
          <div className={s.footerTop}>
            <div className={s.footerBrand}>
              <Link href="/" className={s.brand}>
                <Layers size={28} />
                {settings.siteName}
              </Link>
              <p>
                Good ideas deserve a head start.
                <br />
                Find the digital resources to make yours happen.
              </p>
            </div>
            <div>
              <h2>Explore</h2>
              <Link href="/browse">All resources</Link>
              {categories.slice(0, 5).map((c) => (
                <Link href={`/category/${c.slug}`} key={c.id}>
                  {c.name}
                </Link>
              ))}
            </div>
            <div>
              <h2>Your collection</h2>
              <Link href="/account">Order history</Link>
              <Link href="/account">Your downloads</Link>
              <Link href="/cart">Shopping cart</Link>
            </div>
            <div>
              <h2>Let&apos;s talk</h2>
              {settings.contactEmail && (
                <a href={`mailto:${settings.contactEmail}`}>
                  Contact us <ArrowUpRight size={14} />
                </a>
              )}
              {settings.whatsapp && (
                <a
                  href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                >
                  WhatsApp <ArrowUpRight size={14} />
                </a>
              )}
              <Link href="/#how-it-works">How it works</Link>
              <p>
                Pay with Easypaisa,
                <br />
                JazzCash or bank transfer.
              </p>
            </div>
          </div>
          <div className={s.footerBottom}>
            <span>
              &copy; {new Date().getFullYear()} {settings.siteName}
            </span>
            <span>Digital resources. Local payments. Yours to use.</span>
            <span>Pakistan &middot; PKR</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
