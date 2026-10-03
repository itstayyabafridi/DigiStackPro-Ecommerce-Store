import "server-only";
import { storage } from "./supabase";
export const buckets = {
  products: "product-files",
  screenshots: "payment-proofs",
  images: "store-images",
} as const;
export async function signedFile(path: string, seconds = 86400) {
  const { data, error } = await storage()
    .storage.from(buckets.products)
    .createSignedUrl(path, seconds, { download: true });
  if (error)
    throw new Error(
      "The download could not be prepared. Please contact the store.",
    );
  return data.signedUrl;
}
export function imageType(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v))
    return "image/png";
  if (
    Buffer.from(bytes.slice(0, 4)).toString() === "RIFF" &&
    Buffer.from(bytes.slice(8, 12)).toString() === "WEBP"
  )
    return "image/webp";
  return null;
}
