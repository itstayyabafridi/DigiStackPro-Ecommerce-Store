import { Checkout } from "@/components/checkout";
import { getSettings } from "@/lib/settings";
export const metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};
export default async function CheckoutPage() {
  const s = await getSettings();
  const methods = [
    { value: "easypaisa", label: "Easypaisa" },
    { value: "jazzcash", label: "JazzCash" },
    { value: "bank", label: "Bank transfer" },
  ].filter((m) => s[m.value as "bank"]);
  return (
    <section className="container max-w-xl py-14">
      <h1 className="page-title mb-4">Make it yours.</h1>
      <p className="mb-9 text-slate-500">
        Enter your details, review the total, then upload your payment receipt.
      </p>
      <Checkout methods={methods} />
    </section>
  );
}
