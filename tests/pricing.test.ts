import { describe, it, expect } from "vitest";
import { discountFor, type DiscountCoupon } from "@/lib/pricing";
const coupon: DiscountCoupon = {
  kind: "percent",
  value: 15,
  minimum: 100,
  active: true,
  startsAt: null,
  expiresAt: null,
  limit: null,
};
describe("coupon arithmetic and eligibility", () => {
  it("rounds percentage discounts to integer paisa", () =>
    expect(discountFor(999, coupon)).toBe(149));
  it("caps fixed discounts at subtotal", () =>
    expect(discountFor(1000, { ...coupon, kind: "fixed", value: 2000 })).toBe(
      1000,
    ));
  it("rejects exhausted, inactive, expired, future and below-minimum coupons", () => {
    for (const c of [
      { ...coupon, limit: 1 },
      { ...coupon, active: false },
      { ...coupon, expiresAt: new Date(0) },
      { ...coupon, startsAt: new Date("2100-01-01") },
      { ...coupon, minimum: 10001 },
    ])
      expect(() => discountFor(1000, c, 1)).toThrow();
  });
});
