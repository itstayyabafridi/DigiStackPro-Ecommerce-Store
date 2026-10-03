import "server-only";
import { cache } from "react";
import { z } from "zod";
import { db } from "./db";
import { databaseConfigured } from "./config";
export const settingsSchema = z.object({
  siteName: z.string().min(1).max(80).default("DigistackPro"),
  logo: z.union([z.string().url(), z.literal("")]).default(""),
  favicon: z.union([z.string().url(), z.literal("")]).default(""),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#2457e6"),
  heroTitle: z
    .string()
    .min(1)
    .max(150)
    .default("A head start, ready to download."),
  heroDescription: z
    .string()
    .max(500)
    .default(
      "Practical templates, creative assets, and useful tools for your next project. Pay locally. Get your files after payment approval.",
    ),
  whatsapp: z.string().max(30).default(""),
  contactEmail: z.union([z.string().email(), z.literal("")]).default(""),
  easypaisa: z.string().max(2000).default(""),
  jazzcash: z.string().max(2000).default(""),
  bank: z.string().max(2000).default(""),
  seoTitle: z
    .string()
    .max(160)
    .default("Digital resources for your next project"),
  seoDescription: z
    .string()
    .max(300)
    .default(
      "Explore downloadable templates, creative assets, and tools. Pay with Easypaisa, JazzCash, or bank transfer.",
    ),
});
export type SiteSettings = z.infer<typeof settingsSchema>;
export const getSettings = cache(async (): Promise<SiteSettings> => {
  if (!databaseConfigured()) return settingsSchema.parse({});
  const settings = await db.setting.findUnique({ where: { key: "site" } });
  return settingsSchema.parse(settings?.value ?? {});
});
