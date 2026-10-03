import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

// Recovery deliberately does not share the storefront's SSR cookies or storage.
let client: SupabaseClient | undefined;
export function recoveryClient() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Password recovery is not configured.");
    client = createClient(url, key, {
      auth: {
        flowType: "implicit",
        storageKey: "digistackpro-admin-recovery",
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(128, "Use at most 128 characters."),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });
export function recoveryCredentials(url: URL) {
  const fragment = new URLSearchParams(url.hash.slice(1));
  if (fragment.has("error") || url.searchParams.has("error"))
    throw new Error(
      "This recovery link is invalid or expired. Request a new one.",
    );
  if (fragment.get("type") === "recovery") {
    const value = z
      .object({
        access_token: z.string().min(1).max(16384),
        refresh_token: z.string().min(1).max(4096),
      })
      .safeParse({
        access_token: fragment.get("access_token"),
        refresh_token: fragment.get("refresh_token"),
      });
    if (value.success) return { kind: "session" as const, ...value.data };
  }
  if (url.searchParams.get("type") === "recovery") {
    const hash = z
      .string()
      .min(1)
      .max(1024)
      .safeParse(url.searchParams.get("token_hash"));
    if (hash.success) return { kind: "hash" as const, token_hash: hash.data };
  }
  throw new Error(
    "Open the latest password recovery link from your email. If it has expired or was already used, request a new one.",
  );
}
