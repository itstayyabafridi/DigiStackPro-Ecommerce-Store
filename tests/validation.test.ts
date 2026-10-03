import { expect, it } from "vitest";
import { productSchema, couponSchema } from "@/lib/admin-schemas";
import { imageType } from "@/lib/files";
it("rejects fractional or excessive percentage coupons", () => {
  for (const value of [100.5, 101, 0])
    expect(
      couponSchema.safeParse({
        code: "SAVE",
        kind: "percent",
        value,
        minimum: 0,
        active: true,
      }).success,
    ).toBe(false);
});
it("rejects unsafe product file paths", () => {
  expect(
    productSchema.safeParse({
      title: "Test",
      slug: "test",
      description: "Test",
      price: 100,
      filePath: "../private",
      thumbnailUrl: "https://example.com/a.png",
      isPublished: true,
      isFeatured: false,
    }).success,
  ).toBe(false);
});
it("checks image signatures rather than trusting filenames", () => {
  expect(imageType(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(
    "image/png",
  );
  expect(
    imageType(new TextEncoder().encode('<svg onload="alert(1)"/>')),
  ).toBeNull();
});
