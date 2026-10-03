"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { LoaderCircle } from "lucide-react";
import styles from "./login.module.css";
export function Login({
  admin = false,
  destination = "/account",
  appearance = "default",
}: {
  admin?: boolean;
  destination?: string;
  appearance?: "default" | "admin";
}) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const router = useRouter();
  const dark = appearance === "admin";
  return (
    <form
      className={dark ? styles.form : "space-y-5"}
      aria-busy={busy}
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        setFailed(false);
        const form = new FormData(event.currentTarget);
        try {
          const response = await fetch("/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: form.get("email"),
              ...(sent ? { code: form.get("code") } : {}),
              admin,
            }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          if (data.verified) {
            router.push(destination);
            router.refresh();
          } else {
            setSent(true);
            setMessage(data.message);
          }
        } catch (e) {
          setFailed(true);
          setMessage(e instanceof Error ? e.message : "Could not sign in.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className={dark ? styles.field : "field"}>
        Email
        <Input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={dark ? "you@example.com" : undefined}
          className={dark ? styles.input : undefined}
          readOnly={sent}
          disabled={busy}
        />
      </label>
      {sent && (
        <label className={dark ? styles.field : "field"}>
          Email code
          <Input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6,10}"
            required
            placeholder={dark ? "Enter your verification code" : undefined}
            className={dark ? styles.input : undefined}
            disabled={busy}
            minLength={6}
            maxLength={10}
          />
        </label>
      )}
      <Button disabled={busy} className={dark ? styles.submit : undefined}>
        {busy && (
          <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
        )}
        {busy ? "Please wait…" : sent ? "Verify code" : "Email me a code"}
      </Button>
      {sent && (
        <Button
          type="button"
          variant="ghost"
          className={dark ? styles.resend : undefined}
          disabled={busy}
          onClick={() => {
            setSent(false);
            setMessage("");
            setFailed(false);
          }}
        >
          Request another code
        </Button>
      )}
      <p
        role="status"
        className={
          dark
            ? `${styles.message} ${failed ? styles.error : ""}`
            : "text-sm text-slate-600"
        }
      >
        {message}
      </p>
    </form>
  );
}
export function Logout() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
