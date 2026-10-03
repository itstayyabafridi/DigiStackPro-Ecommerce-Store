"use client";
import { AssetImage } from "@/components/asset-image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Upload } from "./upload";
export type Field = {
  name: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "number"
    | "checkbox"
    | "select"
    | "images"
    | "products"
    | "datetime-local"
    | "email"
    | "color";
  options?: { value: string; label: string }[];
  required?: boolean;
};
export function AdminForm({
  action,
  fields,
  initial = {},
  returnTo,
}: {
  action: string;
  fields: Field[];
  initial?: Record<string, unknown>;
  returnTo?: string;
}) {
  const [values, setValues] = useState(initial);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const set = (key: string, value: unknown) =>
    setValues((v) => ({ ...v, [key]: value }));
  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        try {
          const response = await fetch("/api/admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, data: values }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          setMessage("Saved.");
          if (returnTo) router.push(returnTo);
          router.refresh();
        } catch (error) {
          setMessage(
            error instanceof Error ? error.message : "Could not save.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      {fields.map((f) => (
        <div key={f.name} className="space-y-2">
          {f.type === "checkbox" ? (
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={!!values[f.name]}
                onChange={(e) => set(f.name, e.target.checked)}
              />
              {f.label}
            </label>
          ) : (
            <>
              <label htmlFor={f.name} className="field">
                {f.label}
              </label>
              {f.type === "textarea" ? (
                <Textarea
                  id={f.name}
                  value={String(values[f.name] ?? "")}
                  onChange={(e) => set(f.name, e.target.value)}
                  required={f.required}
                />
              ) : f.type === "select" ? (
                <select
                  id={f.name}
                  className="select"
                  value={String(values[f.name] ?? "")}
                  onChange={(e) => set(f.name, e.target.value)}
                >
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === "images" || f.type === "products" ? (
                <>
                  <Upload kind={f.type} onUploaded={(v) => set(f.name, v)} />
                  <Input
                    id={f.name}
                    value={String(values[f.name] ?? "")}
                    readOnly
                    placeholder="Upload a file above"
                    required={f.required}
                  />
                  {f.type === "images" && !!values[f.name] && (
                    <AssetImage
                      alt="Uploaded preview"
                      src={String(values[f.name])}
                      className="max-h-40 rounded object-contain"
                    />
                  )}
                </>
              ) : (
                <Input
                  id={f.name}
                  type={f.type ?? "text"}
                  step={f.type === "number" ? "0.01" : undefined}
                  value={String(values[f.name] ?? "")}
                  onChange={(e) => set(f.name, e.target.value)}
                  required={f.required}
                />
              )}
            </>
          )}
        </div>
      ))}
      <Button disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
      <p role="status" className="text-sm">
        {message}
      </p>
    </form>
  );
}
export function AdminAction({
  action,
  data,
  children,
  destructive = false,
}: {
  action: string;
  data: unknown;
  children: React.ReactNode;
  destructive?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <span className="inline-flex flex-col gap-2">
      <Button
        variant={destructive ? "destructive" : "outline"}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const response = await fetch("/api/admin", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action, data }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            router.refresh();
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Failed.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Please wait…" : children}
      </Button>
      <span role="status" className="text-sm text-red-700">
        {message}
      </span>
    </span>
  );
}
export function OrderReview({ id }: { id: string }) {
  const [note, setNote] = useState("");
  return (
    <div className="mt-6 space-y-4">
      <label className="field">
        Internal admin note
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={2000}
        />
      </label>
      <div className="flex gap-3">
        <AdminAction action="approve" data={{ id, note }}>
          Approve payment
        </AdminAction>
        <AdminAction action="reject" data={{ id, note }} destructive>
          Reject payment
        </AdminAction>
      </div>
    </div>
  );
}
