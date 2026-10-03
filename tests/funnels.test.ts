import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import {
  validateFunnel,
  nextStep,
  defaultConfig,
  type EditorStep,
} from "@/lib/funnel-schema";
function step(type: EditorStep["type"]): EditorStep {
  return {
    id: randomUUID(),
    type,
    config: defaultConfig(type),
    productId: randomUUID(),
    nextOnAccept: null,
    nextOnDecline: null,
  };
}
describe("funnel graph validation", () => {
  it("accepts a sequential checkout/offer/thank-you flow", () =>
    expect(() =>
      validateFunnel([
        step("landing"),
        step("checkout"),
        step("upsell"),
        step("thank_you"),
      ]),
    ).not.toThrow());
  it("requires exactly one checkout", () => {
    expect(() => validateFunnel([step("landing")])).toThrow();
    expect(() =>
      validateFunnel([step("checkout"), step("checkout")]),
    ).toThrow();
  });
  it("blocks implicit-next and explicit-back loops", () => {
    const a = step("checkout"),
      b = step("upsell");
    b.nextOnDecline = a.id;
    expect(() => validateFunnel([a, b])).toThrow(/loops/);
  });
  it("blocks a branch bypassing checkout", () => {
    const a = step("upsell"),
      b = step("checkout"),
      c = step("thank_you");
    a.nextOnDecline = c.id;
    expect(() => validateFunnel([a, b, c])).toThrow(/checkout/);
  });
  it("blocks foreign targets and missing offer products", () => {
    const a = step("checkout");
    a.nextOnAccept = randomUUID();
    expect(() => validateFunnel([a])).toThrow(/missing/);
    a.nextOnAccept = null;
    a.productId = null;
    expect(() => validateFunnel([a])).toThrow(/product/);
  });
  it("resolves explicit paths before next position", () => {
    const a = step("checkout"),
      b = step("upsell"),
      c = step("thank_you");
    a.nextOnAccept = c.id;
    expect(nextStep([a, b, c], a.id, "accept")).toBe(c.id);
    expect(nextStep([a, b, c], b.id, "decline")).toBe(c.id);
    expect(nextStep([a, b, c], c.id, "accept")).toBeNull();
  });
});
