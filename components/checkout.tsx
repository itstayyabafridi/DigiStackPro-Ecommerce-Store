"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./cart";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Upload } from "./upload";
export function Checkout({
  methods,
  funnel,
}: {
  methods: { value: string; label: string }[];
  funnel?: { slug: string; stepId: string };
}) {
  const cart = useCart();
  const [attemptId] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        const values = Object.fromEntries(new FormData(event.currentTarget));
        try {
          const res = await fetch(funnel ? "/api/funnels" : "/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...values,
              attemptId,
              productIds: cart.map((p) => p.id),
              ...(funnel ? { ...funnel, action: "checkout" } : {}),
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          router.push(data.url);
          router.refresh();
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "Checkout failed.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field">
        Your name
        <Input
          name="name"
          autoComplete="name"
          minLength={2}
          maxLength={100}
          required
        />
      </label>
      <label className="field">
        Delivery email
        <Input name="email" autoComplete="email" type="email" required />
        <span className="font-normal text-slate-500">
          Your downloads will be sent here. Please check it carefully.
        </span>
      </label>
      <label className="field">
        WhatsApp number
        <Input
          name="whatsapp"
          type="tel"
          autoComplete="tel"
          placeholder="+92 300 1234567"
          required
        />
      </label>
      <label className="field">
        Payment method
        <select name="paymentMethod" className="select" required>
          {methods.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
      {!funnel && (
        <label className="field">
          Coupon code (optional)
          <Input name="coupon" maxLength={40} />
        </label>
      )}
      <Button disabled={busy || !methods.length || (!funnel && !cart.length)}>
        {busy
          ? "Preparing your order…"
          : funnel
            ? "Continue"
            : "Review order and pay"}
      </Button>
      {!methods.length && (
        <p>
          Checkout is unavailable until payment instructions are configured.
        </p>
      )}
      <p role="status" className="text-sm text-red-700">
        {message}
      </p>
      <p className="text-sm text-slate-500">
        No account needed. Downloads are available after payment approval.
      </p>
    </form>
  );
}
export function PaymentUpload({ orderId }: { orderId: string }) {
  const router = useRouter();
  return (
    <Upload
      kind="screenshots"
      orderId={orderId}
      onUploaded={() => router.refresh()}
    />
  );
}
export function NewCheckout() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      onClick={async () => {
        await fetch("/api/checkout/reset", { method: "POST" });
        router.push("/cart");
        router.refresh();
      }}
    >
      Start another order
    </Button>
  );
}
