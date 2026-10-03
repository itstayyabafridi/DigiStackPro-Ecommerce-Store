"use client";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Button } from "./ui/button";
import { money } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";
export type CartItem = {
  id: string;
  title: string;
  price: number;
  slug: string;
  thumbnailUrl: string;
};
const key = "digistack-cart";
function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("cart", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("cart", cb);
  };
}
function snapshot() {
  return localStorage.getItem(key) ?? "[]";
}
export function useCart(): CartItem[] {
  const value = useSyncExternalStore(subscribe, snapshot, () => "[]");
  try {
    const items = JSON.parse(value);
    return Array.isArray(items)
      ? items.filter(
          (x) =>
            x &&
            typeof x.id === "string" &&
            typeof x.title === "string" &&
            typeof x.price === "number",
        )
      : [];
  } catch {
    return [];
  }
}
function save(items: CartItem[]) {
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new Event("cart"));
}
export function AddToCart({
  product,
  className,
  label,
}: {
  product: CartItem;
  className?: string;
  label?: string;
}) {
  const cart = useCart();
  const added = cart.some((p) => p.id === product.id);
  return (
    <Button
      className={className}
      aria-label={added ? "Added to cart" : `Add ${product.title} to cart`}
      onClick={() => {
        if (!added) save([...cart, product]);
      }}
      disabled={added}
    >
      {label && <ShoppingCart size={18} aria-hidden="true" />}
      {added ? "Added to cart" : (label ?? "Add to cart")}
    </Button>
  );
}
export function Cart() {
  const cart = useCart();
  return (
    <div className="space-y-6">
      {cart.map((p) => (
        <div
          key={p.id}
          className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5"
        >
          <Link href={`/products/${p.slug}`} className="font-semibold">
            {p.title}
          </Link>
          <div className="flex items-center gap-5">
            <span>{money(p.price)}</span>
            <Button
              variant="ghost"
              onClick={() => save(cart.filter((x) => x.id !== p.id))}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
      {cart.length ? (
        <>
          <p className="text-right text-xl font-semibold">
            Estimated total {money(cart.reduce((sum, p) => sum + p.price, 0))}
          </p>
          <p className="text-sm text-slate-500">
            Prices and discounts are confirmed at checkout.
          </p>
          <Button asChild>
            <Link href="/checkout">Continue to checkout</Link>
          </Button>
        </>
      ) : (
        <>
          <p>Your cart is empty. Find a resource for your next project.</p>
          <Button asChild>
            <Link href="/#catalog">Browse resources</Link>
          </Button>
        </>
      )}
    </div>
  );
}
