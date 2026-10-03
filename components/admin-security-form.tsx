"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
export function AdminSecurityForm({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(enabled);
  const [saved, setSaved] = useState(enabled);
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  return (
    <Card className="mb-8 block p-6">
      <h2 className="mb-2 text-lg font-semibold">Admin sign-in security</h2>
      <p className="mb-5 text-sm text-slate-600">
        Sign in with your email and password. Turn on email verification to also
        require an email code for every new admin sign-in. This applies to all
        administrators.
      </p>
      <form
        className="space-y-4"
        aria-busy={busy}
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setBusy(true);
          setMessage("");
          setError(false);
          try {
            const response = await fetch("/api/admin/security", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                enabled: value,
                ...(pending ? { code: form.get("code") } : {}),
              }),
            });
            const result = await response.json();
            if (!response.ok)
              throw new Error(
                result.error || "Could not save security settings.",
              );
            if (result.verificationRequired) {
              setPending(true);
              setMessage(
                "Enter the code sent to your email to enable verification. The setting stays off until you confirm.",
              );
            } else {
              setSaved(value);
              setPending(false);
              setMessage(
                value
                  ? "Email verification is on."
                  : "Email verification is off.",
              );
              router.refresh();
            }
          } catch (e) {
            setError(true);
            setMessage(
              e instanceof Error
                ? e.message
                : "Could not save security settings.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="flex items-center gap-3 font-medium">
          <input
            className="h-5 w-5 accent-primary"
            type="checkbox"
            role="switch"
            checked={value}
            disabled={busy}
            onChange={(e) => {
              setValue(e.target.checked);
              setPending(false);
              setMessage("");
            }}
          />
          Two-step verification (email code)
        </label>
        {pending && (
          <label className="field">
            Verification code
            <Input
              name="code"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,10}"
              minLength={6}
              maxLength={10}
              disabled={busy}
            />
          </label>
        )}
        <Button disabled={busy || (!pending && value === saved)}>
          {busy
            ? "Please wait…"
            : pending
              ? "Verify and enable"
              : "Save sign-in security"}
        </Button>
        <p
          className={`text-sm ${error ? "text-red-700" : "text-slate-600"}`}
          role={error ? "alert" : "status"}
        >
          {message}
        </p>
      </form>
    </Card>
  );
}
