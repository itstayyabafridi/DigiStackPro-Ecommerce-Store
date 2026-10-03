"use client";
import { AssetImage } from "@/components/asset-image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Checkout } from "./checkout";
import {
  configSchemas,
  type StepType,
  type StepConfig,
} from "@/lib/funnel-schema";
import { money } from "@/lib/utils";
type Props = {
  type: StepType;
  config: Record<string, unknown>;
  slug: string;
  stepId: string;
  methods: { value: string; label: string }[];
  product?: { title: string; price: number; thumbnailUrl: string } | null;
  preview?: boolean;
};
export function FunnelAction({
  slug,
  stepId,
  action,
  children,
  secondary,
  disabled,
}: {
  slug: string;
  stepId?: string;
  action: "start" | "accept" | "decline";
  children: React.ReactNode;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <Button
        variant={secondary ? "ghost" : "default"}
        disabled={busy || disabled}
        onClick={async () => {
          setBusy(true);
          try {
            const r = await fetch("/api/funnels", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug, stepId, action }),
            });
            const result = await r.json();
            if (!r.ok) throw new Error(result.error);
            router.push(result.url);
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not continue.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Please wait…" : children}
      </Button>
      <p role="status" className="mt-2 text-sm text-red-700">
        {error}
      </p>
    </div>
  );
}
function Content({ config, product }: Props) {
  return (
    <>
      <h1 className="page-title">{String(config.heading)}</h1>
      <p className="prose-copy my-6">{String(config.body ?? "")}</p>
      {product && (
        <div className="my-7 overflow-hidden rounded-xl border bg-white">
          <AssetImage
            src={product.thumbnailUrl}
            alt={product.title}
            className="aspect-[2/1] w-full object-cover"
          />
          <div className="flex justify-between gap-5 p-5">
            <h2 className="font-semibold">{product.title}</h2>
            <span>{money(product.price)}</span>
          </div>
        </div>
      )}
    </>
  );
}
function Landing(props: Props) {
  return (
    <>
      <Content {...props} />
      <FunnelAction
        slug={props.slug}
        stepId={props.stepId}
        action="accept"
        disabled={props.preview}
      >
        {String(props.config.acceptLabel)}
      </FunnelAction>
    </>
  );
}
function Offer(props: Props) {
  return (
    <>
      <Content {...props} />
      <div className="flex flex-wrap gap-4">
        <FunnelAction
          slug={props.slug}
          stepId={props.stepId}
          action="accept"
          disabled={props.preview}
        >
          {String(props.config.acceptLabel)}
        </FunnelAction>
        <FunnelAction
          slug={props.slug}
          stepId={props.stepId}
          action="decline"
          secondary
          disabled={props.preview}
        >
          {(props.config as StepConfig).declineLabel}
        </FunnelAction>
      </div>
      <p className="mt-4 text-sm text-slate-500">
        Accepting adds this product to your order. Pay once after your final
        selection.
      </p>
    </>
  );
}
function CheckoutStep(props: Props) {
  return (
    <>
      <Content {...props} />
      {props.preview ? (
        <p>Customer details and payment-method form appears here.</p>
      ) : (
        <Checkout
          methods={props.methods}
          funnel={{ slug: props.slug, stepId: props.stepId }}
        />
      )}
    </>
  );
}
export const stepRegistry = {
  landing: { component: Landing, schema: configSchemas.landing },
  checkout: { component: CheckoutStep, schema: configSchemas.checkout },
  order_bump: { component: Offer, schema: configSchemas.order_bump },
  upsell: { component: Offer, schema: configSchemas.upsell },
  downsell: { component: Offer, schema: configSchemas.downsell },
  thank_you: { component: Landing, schema: configSchemas.thank_you },
};
export function FunnelStepView(props: Props) {
  const entry = stepRegistry[props.type];
  const parsed = entry.schema.parse(props.config);
  const Component = entry.component;
  return <Component {...props} config={parsed} />;
}
