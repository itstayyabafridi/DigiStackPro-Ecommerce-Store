import { AssetImage } from "@/components/asset-image";
import Link from "next/link";
import { money } from "@/lib/utils";
import { AddToCart } from "./cart";
import { Artwork } from "./store/artwork";
import s from "./store/store.module.css";
export type CatalogProduct = {
  id: string;
  title: string;
  slug: string;
  price: number;
  thumbnailUrl: string;
  isFeatured?: boolean;
  category?: { name: string } | null;
};
export function ProductCard({ product: p }: { product: CatalogProduct }) {
  return (
    <article className={s.productCard}>
      <Link href={`/products/${p.slug}`} className={s.productImage}>
        {p.thumbnailUrl ? (
          <AssetImage src={p.thumbnailUrl} alt={p.title} />
        ) : (
          <Artwork
            name={p.title}
            variant={[...p.slug].reduce((n, c) => n + c.charCodeAt(0), 0) % 4}
          />
        )}{" "}
        {p.isFeatured && <span className={s.featured}>Featured</span>}
      </Link>
      <div className={s.productInfo}>
        <p>{p.category?.name ?? "Digital download"}</p>
        <Link href={`/products/${p.slug}`}>
          <h3 title={p.title}>{p.title}</h3>
        </Link>
        <AddToCart
          product={p}
          className={s.priceButton}
          label={money(p.price)}
        />
      </div>
    </article>
  );
}
