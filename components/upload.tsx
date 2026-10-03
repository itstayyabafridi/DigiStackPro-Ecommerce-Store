"use client";
import { createClient } from "@supabase/supabase-js";
import { useState } from "react";
import { Input } from "./ui/input";
export function Upload({
  kind,
  onUploaded,
  orderId,
}: {
  kind: "products" | "images" | "screenshots";
  onUploaded: (value: string) => void;
  orderId?: string;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      <Input
        aria-label={`Upload ${kind}`}
        type="file"
        disabled={busy}
        accept={
          kind === "products" ? undefined : "image/png,image/jpeg,image/webp"
        }
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setBusy(true);
          setMessage("Uploading…");
          try {
            const payload = {
              kind,
              name: file.name,
              size: file.size,
              type: file.type,
              orderId,
            };
            const prepare = await fetch("/api/uploads", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const data = await prepare.json();
            if (!prepare.ok) throw new Error(data.error);
            const client = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              { auth: { persistSession: false } },
            );
            const { error } = await client.storage
              .from(data.bucket)
              .uploadToSignedUrl(data.path, data.token, file, {
                contentType: file.type || "application/octet-stream",
              });
            if (error) throw new Error(error.message);
            const finish = await fetch("/api/uploads", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...payload, path: data.path }),
            });
            const result = await finish.json();
            if (!finish.ok) throw new Error(result.error);
            setMessage("Upload complete.");
            onUploaded(result.value);
          } catch (error) {
            setMessage(
              error instanceof Error ? error.message : "Upload failed.",
            );
          } finally {
            setBusy(false);
            event.target.value = "";
          }
        }}
      />
      <p role="status" className="text-sm text-slate-500">
        {message ||
          (kind === "products"
            ? "Maximum 100 MiB. Existing purchases keep their original file."
            : "JPEG, PNG, or WebP. Maximum 5 MiB.")}
      </p>
    </div>
  );
}
