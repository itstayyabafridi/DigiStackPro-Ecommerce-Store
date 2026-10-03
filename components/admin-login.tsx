"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LoaderCircle, ArrowRight } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import s from "./admin/login-form.module.css";
export function AdminLogin({ destination }: { destination: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"password" | "code">("password");
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  return (
    <form
      className={s.form}
      aria-busy={busy}
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        setBusy(true);
        setMessage("");
        setFailed(false);
        try {
          const response = await fetch("/api/admin-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              step === "password"
                ? {
                    step,
                    email: data.get("email"),
                    password: data.get("password"),
                  }
                : { step, code: data.get("code") },
            ),
          });
          const result = await response.json();
          if (!response.ok)
            throw new Error(result.error || "Could not sign in.");
          form.reset();
          if (result.verified) {
            router.push(destination);
            router.refresh();
          } else {
            setStep("code");
            setMessage(result.message);
          }
        } catch (error) {
          setFailed(true);
          setMessage(
            error instanceof Error ? error.message : "Could not sign in.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      {step === "password" ? (
        <>
          <label className={s.field}>
            Email
            <Input
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={254}
              placeholder="you@example.com"
              className={s.input}
              disabled={busy}
            />
          </label>
          <label className={s.field}>
            Password
            <span className="relative block">
              <Input
                name="password"
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                required
                maxLength={1024}
                className={`${s.input} pr-12`}
                disabled={busy}
              />
              <button
                type="button"
                className={s.reveal}
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
        </>
      ) : (
        <label className={s.field}>
          Email verification code
          <Input
            name="code"
            autoFocus
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]{6,10}"
            minLength={6}
            maxLength={10}
            required
            className={s.input}
            disabled={busy}
          />
        </label>
      )}
      <Button className={s.submit} disabled={busy}>
        {busy && (
          <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
        )}
        {busy
          ? "Please wait…"
          : step === "password"
            ? "Sign in"
            : "Verify and sign in"}
      {!busy && <ArrowRight size={21} aria-hidden="true" />}
      </Button>
      {step === "code" && (
        <Button
          type="button"
          variant="ghost"
          className={s.resend}
          disabled={busy}
          onClick={() => {
            setStep("password");
            setMessage("");
            setFailed(false);
          }}
        >
          Back to sign in / request a new code
        </Button>
      )}
      {step === "password" && (
        <Link
          href={`${destination.replace(/\/$/, "")}/forgot-password`}
          className={s.forgot}
        >
          Forgot Password?
        </Link>
      )}
      <p
        role={failed ? "alert" : "status"}
        className={`${s.message} ${failed ? s.error : ""}`}
      >
        {message}
      </p>
    </form>
  );
}
