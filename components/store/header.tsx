"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Layers,
  ShoppingCart,
  Package,
  ArrowUpRight,
} from "lucide-react";
import { useCart } from "@/components/cart";
import { AssetImage } from "@/components/asset-image";
import s from "./store.module.css";
export function StoreHeader({
  siteName,
  logo,
  categories,
}: {
  siteName: string;
  logo: string;
  categories: { name: string; slug: string }[];
}) {
  const path = usePathname();
  const cart = useCart();
  return (
    <>
      <header className={s.header}>
        <div className={s.headerMain}>
          <Link href="/" className={s.brand}>
            {logo ? <AssetImage src={logo} alt="" /> : <Layers size={30} />}
            <span>{siteName}</span>
          </Link>
          <form action="/browse" role="search" className={s.search}>
            <Search size={21} />
            <input
              name="q"
              aria-label="Search products"
              placeholder="Search products…"
              maxLength={120}
            />
            <button type="submit" aria-label="Submit search">
              <ArrowUpRight size={19} />
            </button>
          </form>
          <nav className={s.actions} aria-label="Main navigation">
            <Link href="/account">
              <Package size={22} />
              <span>My Orders</span>
            </Link>
            <Link href="/cart">
              <span className={s.cartIcon}>
                <ShoppingCart size={24} />
                {cart.length > 0 && <b>{cart.length}</b>}
              </span>
              <span>Cart</span>
            </Link>
          </nav>
        </div>
      </header>
      <nav className={s.categoryNav} aria-label="Product categories">
        <Link
          href="/browse"
          aria-current={path === "/browse" ? "page" : undefined}
        >
          All categories
        </Link>
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            aria-current={path === `/category/${c.slug}` ? "page" : undefined}
          >
            {c.name}
          </Link>
        ))}
        <Link href="/#how-it-works">How it works</Link>
      </nav>
    </>
  );
}
