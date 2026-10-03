import { z } from "zod";
export const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const optionalId = z.union([z.string().uuid(), z.literal("")]).optional();
const utcDateInput = z
  .union([
    z.literal(""),
    z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/),
  ])
  .optional();
export const productSchema = z.object({
  id: optionalId,
  title: z.string().trim().min(1).max(150),
  slug: slugSchema,
  description: z.string().min(1).max(20000),
  price: z.coerce
    .number()
    .positive()
    .max(1000000)
    .transform((v) => Math.round(v * 100)),
  thumbnailUrl: z.string().url(),
  filePath: z.string().regex(/^assets\/[a-zA-Z0-9.-]+$/),
  categoryId: optionalId,
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
});
export const categorySchema = z.object({
  id: optionalId,
  name: z.string().trim().min(1).max(100),
  slug: slugSchema,
});
export const couponSchema = z
  .object({
    id: optionalId,
    code: z
      .string()
      .trim()
      .min(1)
      .max(40)
      .regex(/^[a-zA-Z0-9_-]+$/)
      .transform((v) => v.toUpperCase()),
    kind: z.enum(["percent", "fixed"]),
    value: z.coerce.number().positive().max(1000000),
    minimum: z.coerce
      .number()
      .min(0)
      .max(1000000)
      .transform((v) => Math.round(v * 100)),
    active: z.boolean(),
    startsAt: utcDateInput,
    expiresAt: utcDateInput,
    limit: z
      .union([z.literal(""), z.coerce.number().int().positive()])
      .optional(),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "percent" && (v.value > 100 || !Number.isInteger(v.value)))
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Percentage must be a whole number from 1 to 100.",
      });
    for (const key of ["startsAt", "expiresAt"] as const)
      if (v[key] && Number.isNaN(Date.parse(v[key]!)))
        ctx.addIssue({ code: "custom", path: [key], message: "Invalid date." });
    if (
      v.startsAt &&
      v.expiresAt &&
      new Date(v.startsAt) >= new Date(v.expiresAt)
    )
      ctx.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: "Expiry must follow the start date.",
      });
  });
