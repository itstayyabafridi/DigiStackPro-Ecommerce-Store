import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Download,
  ShieldCheck,
  Wallet,
  Layers,
  MousePointer2,
} from "lucide-react";
import { catalog } from "@/lib/catalog";
import { storeCategories } from "@/lib/storefront";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/site";
import { ProductCard } from "@/components/product-card";
import { AssetImage } from "@/components/asset-image";
import { Artwork } from "@/components/store/artwork";
import s from "@/components/store/store.module.css";
export async function generateMetadata() {
  return { alternates: { canonical: await siteUrl() } };
}
export default async function Home() {
  const [products, settings, categories] = await Promise.all([
    catalog(),
    getSettings(),
    storeCategories(),
  ]);
  return (
    <div className={s.home}>
      <section className={s.heroRow}>
        <div className={s.hero}>
          <div className={s.heroCopy}>
            <p>For the ideas you can&apos;t wait to make.</p>
            <h1>{settings.heroTitle}</h1>
            <p className={s.heroDescription}>{settings.heroDescription}</p>
            <Link className={s.primaryButton} href="/browse">
              Explore the collection <ArrowUpRight size={19} />
            </Link>
          </div>
          <div className={s.heroArt} aria-hidden="true">
            <div className={s.heroPoster}>
              <span>
                DESIGN
                <br />
                YOUR
                <br />
                NEXT.
              </span>
              <i />
            </div>
            <div className={s.heroSticker}>
              <Layers size={36} />
              <span>
                Ideas
                <br />
                in the making.
              </span>
            </div>
            <div className={s.heroTile}>
              Aa<span>Make it yours.</span>
            </div>
            <div className={s.heroCursor}>
              <MousePointer2 size={64} />
            </div>
          </div>
        </div>
        <aside className={s.heroAside}>
          <span className={s.smallIcon}>
            <Download size={24} />
          </span>
          <h2>
            A new idea.
            <br />A head start.
          </h2>
          <p>Buy the resources you need, when you need them.</p>
          <ul>
            <li>
              <Wallet size={17} />
              Familiar local payments
            </li>
            <li>
              <ShieldCheck size={17} />
              Every payment reviewed
            </li>
            <li>
              <Download size={17} />
              Private download links
            </li>
          </ul>
          <Link href="/browse" className={s.primaryButton}>
            Find your next resource <ArrowRight size={17} />
          </Link>
        </aside>
      </section>
      <section id="catalog" className={s.homeSection}>
        <div className={s.sectionHeading}>
          <div>
            <h2>Every kind of idea, a place to start.</h2>
            <p>Explore the collection by category.</p>
          </div>
          <Link href="/browse">
            Browse all <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className={s.categoryGrid}>
          <Link href="/browse" className={s.categoryIntro}>
            <Layers size={28} />
            <h3>
              Your next
              <br />
              great project
              <br />
              starts here.
            </h3>
            <span>
              Explore all resources <ArrowUpRight size={20} />
            </span>
          </Link>
          {categories.map((c, i) => (
            <Link
              href={`/category/${c.slug}`}
              key={c.id}
              className={s.categoryCard}
            >
              <div>
                <h3>{c.name}</h3>
                <p>
                  {c._count.products}{" "}
                  {c._count.products === 1 ? "resource" : "resources"}
                </p>
                <ArrowUpRight size={19} />
              </div>
              <div className={s.categoryCover}>
                {c.products[0]?.thumbnailUrl ? (
                  <AssetImage src={c.products[0].thumbnailUrl} alt="" />
                ) : (
                  <Artwork name={c.name} variant={i} />
                )}
              </div>
            </Link>
          ))}
          {categories.length === 0 && (
            <div className={s.collectionComing}>
              <Artwork name="Room for your next big idea." variant={1} />
              <div>
                <h3>The collection is taking shape.</h3>
                <p>New resources are on their way. Check back soon.</p>
                <Link href="/browse">
                  Explore the store <ArrowUpRight size={18} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
      {products.length > 0 && (
        <section className={s.homeSection}>
          <div className={s.sectionHeading}>
            <div>
              <h2>
                {products.some((p) => p.isFeatured)
                  ? "Worth a closer look."
                  : "Fresh finds for your next project."}
              </h2>
              <p>Digital resources, ready for your creative process.</p>
            </div>
            <Link href="/browse">
              View all <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className={s.homeProducts}>
            {products.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
      {categories.length > 1 && (
        <section className={s.homeSection}>
          <div className={s.sectionHeading}>
            <h2>Find your creative direction.</h2>
          </div>
          <div className={s.collectionGrid}>
            {categories.slice(0, 4).map((c, i) => (
              <Link href={`/category/${c.slug}`} key={c.id}>
                <Artwork name={c.name} variant={(i + 1) % 4} />
                <h3>
                  {c.name} <ArrowUpRight size={16} />
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section className={s.benefitBanner}>
        <div>
          <h2>
            Less starting from scratch.
            <br />
            More making it happen.
          </h2>
          <p>
            A useful resource can be the start of something great. Find your
            next one, make it your own, and get back to creating.
          </p>
          <Link href="/browse" className={s.primaryButton}>
            Explore the collection <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className={s.benefitArt} aria-hidden="true">
          <Artwork name="Make room for good ideas." variant={2} />
        </div>
      </section>
      <section id="how-it-works" className={s.howItWorks}>
        <div className={s.sectionHeading}>
          <h2>From a good find to your next project.</h2>
        </div>
        <div>
          <article>
            <Layers />
            <h3>Find your resource</h3>
            <p>Browse the collection and add your favourites to your cart.</p>
          </article>
          <article>
            <Wallet />
            <h3>Pay your way</h3>
            <p>
              Pay with Easypaisa, JazzCash or bank transfer, then upload your
              payment receipt.
            </p>
          </article>
          <article>
            <Download />
            <h3>Download and create</h3>
            <p>
              After approval, get your private download links by email and in My
              Orders.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
