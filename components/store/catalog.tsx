"use client";
import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Download,
  ShieldCheck,
  PackageOpen,
} from "lucide-react";
import { ProductCard, type CatalogProduct } from "@/components/product-card";
import { money } from "@/lib/utils";
import s from "./store.module.css";
export function StoreCatalog({
  products,
  title,
  query = "",
}: {
  products: CatalogProduct[];
  title: string;
  query?: string;
}) {
  const ceiling = Math.max(...products.map((p) => Math.ceil(p.price / 100)), 1);
  const distribution = Array.from({ length: 12 }, () => 0);
  products.forEach(
    (p) =>
      distribution[Math.min(11, Math.floor((p.price / 100 / ceiling) * 12))]++,
  );
  const largestBin = Math.max(...distribution, 1);
  const [search, setSearch] = useState(query);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [featured, setFeatured] = useState(false);
  const [sort, setSort] = useState("recommended");
  const reset = () => {
    setMin("");
    setMax("");
    setFeatured(false);
    setSearch("");
    setSort("recommended");
  };
  const filtered = products
    .filter(
      (p) =>
        (!search || p.title.toLowerCase().includes(search.toLowerCase())) &&
        (!min || p.price >= Number(min) * 100) &&
        (!max || p.price <= Number(max) * 100) &&
        (!featured || p.isFeatured),
    )
    .sort((a, b) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : sort === "name"
            ? a.title.localeCompare(b.title)
            : 0,
    );
  const avg = products.length
    ? products.reduce((n, p) => n + p.price, 0) / products.length
    : 0;
  return (
    <section className={s.catalogPage}>
      <div className={s.catalogHeading}>
        <div>
          <h1>{title}</h1>
          <p>Find a little inspiration for your next big idea.</p>
        </div>
        <label className={s.sort}>
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recommended">Recommended</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
            <option value="name">Name: A–Z</option>
          </select>
        </label>
      </div>
      <div className={s.catalogLayout}>
        <aside className={s.filters} aria-label="Product filters">
          <details open>
            <summary>
              <SlidersHorizontal size={18} />
              Filters
            </summary>
            <div className={s.filterPanels}>
              <div className={s.filterPanel}>
                <div className={s.filterTitle}>
                  <h2>Price range</h2>
                  <button
                    onClick={() => {
                      setMin("");
                      setMax("");
                    }}
                  >
                    Reset
                  </button>
                </div>
                <p>
                  {products.length
                    ? `Average price ${money(avg)}`
                    : "Prices in Pakistani rupees"}
                </p>
                <div className={s.priceArt} aria-hidden="true">
                  {distribution.map((v, i) => (
                    <i
                      key={i}
                      style={{ height: `${(v / largestBin) * 100}%` }}
                    />
                  ))}
                </div>
                <div className={s.priceInputs}>
                  <label>
                    Min. PKR
                    <input
                      type="number"
                      min="0"
                      max={ceiling}
                      placeholder="0"
                      value={min}
                      onChange={(e) => setMin(e.target.value)}
                    />
                  </label>
                  <span>–</span>
                  <label>
                    Max. PKR
                    <input
                      type="number"
                      min="0"
                      placeholder={String(ceiling)}
                      value={max}
                      onChange={(e) => setMax(e.target.value)}
                    />
                  </label>
                </div>
              </div>
              <div className={s.filterPanel}>
                <h2>Collection</h2>
                <label className={s.check}>
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                  />
                  Featured resources
                </label>
                <button className={s.resetFilters} onClick={reset}>
                  Clear all filters
                </button>
              </div>
              <div className={s.filterPanel}>
                <h2>Made for digital delivery</h2>
                <p className={s.filterFact}>
                  <Download size={19} />
                  Download after payment approval
                </p>
                <p className={s.filterFact}>
                  <ShieldCheck size={19} />
                  Private, secure file links
                </p>
                <span className={s.deliveryPill}>No shipping needed</span>
              </div>
            </div>
          </details>
        </aside>
        <div className={s.results}>
          <div className={s.resultsBar}>
            <p role="status">
              {filtered.length}{" "}
              {filtered.length === 1 ? "resource" : "resources"}
            </p>
            <label className={s.catalogSearch}>
              <Search size={17} />
              <input
                aria-label="Search this collection"
                placeholder="Search this collection…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          {filtered.length ? (
            <div className={s.productGrid}>
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className={s.empty}>
              <PackageOpen size={40} />
              <h2>
                {products.length
                  ? "No matching resources"
                  : "New resources are on their way"}
              </h2>
              <p>
                {products.length
                  ? "Try another search or a wider price range."
                  : "Check back soon for new additions to this collection."}
              </p>
              {products.length > 0 && (
                <button className={s.primaryButton} onClick={reset}>
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
