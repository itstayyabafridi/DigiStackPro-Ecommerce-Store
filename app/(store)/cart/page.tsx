import { Cart } from "@/components/cart";
export const metadata = {
  title: "Your cart",
  robots: { index: false, follow: false },
};
export default function CartPage() {
  return (
    <section className="container max-w-3xl py-14">
      <h1 className="page-title mb-10">Your cart</h1>
      <Cart />
    </section>
  );
}
