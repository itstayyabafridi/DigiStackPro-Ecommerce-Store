export type DiscountCoupon = {
  kind: string;
  value: number;
  minimum: number;
  active: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
  limit: number | null;
};
export function discountFor(
  subtotal: number,
  coupon: DiscountCoupon | null,
  redemptions = 0,
  now = new Date(),
) {
  if (!coupon) return 0;
  if (
    !coupon.active ||
    (coupon.startsAt && coupon.startsAt > now) ||
    (coupon.expiresAt && coupon.expiresAt <= now) ||
    (coupon.limit !== null && redemptions >= coupon.limit) ||
    subtotal < coupon.minimum
  )
    throw new Error("This coupon is unavailable for this order.");
  return Math.min(
    subtotal,
    coupon.kind === "percent"
      ? Math.floor((subtotal * coupon.value) / 100)
      : coupon.value,
  );
}
