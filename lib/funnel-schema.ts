import { z } from "zod";
import { slugSchema } from "./admin-schemas";
export const stepTypes = [
  "landing",
  "checkout",
  "order_bump",
  "upsell",
  "downsell",
  "thank_you",
] as const;
export type StepType = (typeof stepTypes)[number];
const common = {
  heading: z.string().min(1).max(150),
  body: z.string().max(4000),
  acceptLabel: z.string().min(1).max(60),
};
export const configSchemas = {
  landing: z.object(common),
  checkout: z.object(common),
  order_bump: z.object({ ...common, declineLabel: z.string().min(1).max(60) }),
  upsell: z.object({ ...common, declineLabel: z.string().min(1).max(60) }),
  downsell: z.object({ ...common, declineLabel: z.string().min(1).max(60) }),
  thank_you: z.object(common),
};
export type StepConfig = z.infer<typeof configSchemas.upsell>;
export function defaultConfig(type: StepType) {
  return {
    heading: {
      landing: "A useful addition to your toolkit.",
      checkout: "Where should we send your files?",
      order_bump: "Complete your toolkit.",
      upsell: "Take your project further.",
      downsell: "A smaller addition, just for you.",
      thank_you: "Your selection is ready.",
    }[type],
    body: "",
    acceptLabel:
      type === "thank_you"
        ? "Review order and pay"
        : type === "landing"
          ? "Get started"
          : "Continue",
    ...(["upsell", "downsell", "order_bump"].includes(type)
      ? { declineLabel: "No thanks" }
      : {}),
  };
}
export const stepSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(stepTypes),
  config: z.record(z.string(), z.unknown()),
  productId: z.string().uuid().nullable(),
  nextOnAccept: z.string().uuid().nullable(),
  nextOnDecline: z.string().uuid().nullable(),
});
export const funnelSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  slug: slugSchema,
  steps: z.array(stepSchema).max(30),
});
export type EditorStep = z.infer<typeof stepSchema>;
export function nextStep(
  steps: EditorStep[],
  id: string,
  choice: "accept" | "decline",
) {
  const index = steps.findIndex((s) => s.id === id);
  if (index < 0) throw new Error("Unknown funnel step.");
  const step = steps[index];
  if (step.type === "thank_you") return null;
  return (
    (choice === "accept" ? step.nextOnAccept : step.nextOnDecline) ??
    steps[index + 1]?.id ??
    null
  );
}
export function validateFunnel(steps: EditorStep[]) {
  if (steps.filter((s) => s.type === "checkout").length !== 1)
    throw new Error("A funnel must have exactly one checkout step.");
  if (new Set(steps.map((s) => s.id)).size !== steps.length)
    throw new Error("Duplicate step IDs.");
  for (const step of steps) {
    configSchemas[step.type].parse(step.config);
    if (
      ["checkout", "order_bump", "upsell", "downsell"].includes(step.type) &&
      !step.productId
    )
      throw new Error("Checkout and offer steps need a product.");
    if (step.type === "thank_you" && (step.nextOnAccept || step.nextOnDecline))
      throw new Error("Thank-you steps must be terminal.");
    for (const target of [step.nextOnAccept, step.nextOnDecline])
      if (target && !steps.some((s) => s.id === target))
        throw new Error("A path points to a missing step.");
  }
  const visited = new Set<string>();
  function walk(
    id: string | null,
    checkoutSeen: boolean,
    path: Set<string>,
    enforceCheckout: boolean,
  ) {
    if (!id) {
      if (enforceCheckout && !checkoutSeen)
        throw new Error("Every terminal path must pass through checkout.");
      return;
    }
    if (path.has(id)) throw new Error("Funnel paths cannot contain loops.");
    const key = `${id}:${checkoutSeen}:${enforceCheckout}`;
    if (visited.has(key)) return;
    const step = steps.find((s) => s.id === id)!;
    const current = new Set(path).add(id);
    const choices = ["order_bump", "upsell", "downsell"].includes(step.type)
      ? (["accept", "decline"] as const)
      : (["accept"] as const);
    for (const choice of choices)
      walk(
        nextStep(steps, id, choice),
        checkoutSeen || step.type === "checkout",
        current,
        enforceCheckout,
      );
    visited.add(key);
  }
  walk(steps[0]?.id ?? null, false, new Set(), true);
  for (const step of steps) walk(step.id, false, new Set(), false);
}
