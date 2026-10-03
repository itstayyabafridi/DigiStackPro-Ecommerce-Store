import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { guestOrder, submitProof } from "@/lib/orders";
import { storage } from "@/lib/supabase";
import { buckets, imageType } from "@/lib/files";
import { sameOrigin, requestLimit, token, errorMessage } from "@/lib/security";
const schema = z.object({
  kind: z.enum(["products", "images", "screenshots"]),
  name: z.string().min(1).max(200),
  type: z.string().max(100),
  size: z.number().int().positive(),
  orderId: z.string().uuid().optional(),
  path: z.string().max(300).optional(),
});
export async function POST(request: NextRequest) {
  try {
    await sameOrigin();
    await requestLimit("uploads", 40);
    const input = schema.parse(await request.json());
    if (input.kind === "screenshots") {
      if (!input.orderId) throw new Error("Order required.");
      const order = await guestOrder(input.orderId);
      if (
        order.status !== "pending" ||
        order.paymentSubmittedAt ||
        order.funnelSession?.currentStepId
      )
        throw new Error("Order is not ready for payment.");
    } else await requireAdmin();
    const max = input.kind === "products" ? 100 * 1024 * 1024 : 5 * 1024 * 1024;
    if (input.size > max)
      throw new Error(`File exceeds ${max / 1024 / 1024} MiB.`);
    if (
      input.kind !== "products" &&
      !["image/jpeg", "image/png", "image/webp"].includes(input.type)
    )
      throw new Error("Choose a JPEG, PNG, or WebP image.");
    const prefix =
      input.kind === "screenshots" ? `${input.orderId}/` : "assets/";
    const bucket = storage().storage.from(buckets[input.kind]);
    if (!input.path) {
      const extension =
        input.kind === "products"
          ? input.name
              .split(".")
              .pop()
              ?.replace(/[^a-zA-Z0-9]/g, "")
              .slice(0, 10) || "bin"
          : { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }[
              input.type
            ];
      const path = `${prefix}${token()}.${extension}`;
      const { data, error } = await bucket.createSignedUploadUrl(path);
      if (error) throw new Error("Could not prepare upload.");
      return NextResponse.json({
        path,
        token: data.token,
        bucket: buckets[input.kind],
      });
    }
    if (
      !input.path.startsWith(prefix) ||
      input.path.includes("..") ||
      !/^[a-zA-Z0-9/.-]+$/.test(input.path)
    )
      throw new Error("Invalid upload path.");
    const { data: info, error: infoError } = await bucket.info(input.path);
    const actualSize = Number(info?.size ?? info?.metadata?.size ?? 0);
    if (infoError || !info || actualSize <= 0 || actualSize > max)
      throw new Error("Uploaded file is missing or too large.");
    if (input.kind !== "products") {
      const { data, error } = await bucket.download(input.path);
      if (
        error ||
        !data ||
        !imageType(new Uint8Array(await data.arrayBuffer()))
      ) {
        await bucket.remove([input.path]);
        throw new Error("Invalid image content.");
      }
    }
    if (input.kind === "screenshots")
      await submitProof(input.orderId!, input.path);
    const url =
      input.kind === "images"
        ? bucket.getPublicUrl(input.path).data.publicUrl
        : input.path;
    return NextResponse.json({ value: url });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
