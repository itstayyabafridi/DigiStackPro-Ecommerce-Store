"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  recoveryClient,
  recoveryCredentials,
  newPasswordSchema,
} from "@/lib/admin-recovery";
import s from "./login.module.css";

export function ForgotAdminPassword({ base }: { base: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  return (
    <form
      className={s.form}
      aria-busy={busy}
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const result = z
          .string()
          .email()
          .max(254)
          .safeParse(new FormData(form).get("email"));
        if (!result.success) {
          setFailed(true);
          setMessage("Enter a valid email address.");
          return;
        }
        setBusy(true);
        setMessage("");
        setFailed(false);
        try {
          const supabase = recoveryClient();
          const { error } = await supabase.auth.resetPasswordForEmail(
            result.data.trim().toLowerCase(),
            { redirectTo: `${window.location.origin}${base}/reset-password` },
          );
          if (error)
            throw new Error(
              "Could not send a recovery email. Please wait a minute and try again.",
            );
          setMessage(
            "If this email has an account, a password recovery link has been sent. Open the latest email to continue.",
          );
          form.reset();
        } catch (error) {
          setFailed(true);
          setMessage(
            error instanceof Error
              ? error.message
              : "Could not request a password reset.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className={s.field}>
        Admin email
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          className={s.input}
          disabled={busy}
        />
      </label>
      <Button className={s.submit} disabled={busy}>
        {busy ? "Sending…" : "Send recovery link"}
      </Button>
      <p
        role={failed ? "alert" : "status"}
        className={`${s.message} ${failed ? s.error : ""}`}
      >
        {message}
      </p>
      <Link
        href={`${base}/login`}
        className="text-center text-sm text-zinc-300 underline underline-offset-4"
      >
        Back to admin sign in
      </Link>
    </form>
  );
}
async function authorizeRecovery(action: "check" | "complete") {
  const { data } = await recoveryClient().auth.getSession();
  if (!data.session)
    throw new Error("Your recovery session expired. Request a new link.");
  const response = await fetch("/api/admin-recovery", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session.access_token}`,
    },
    body: JSON.stringify({ action }),
  });
  if (!response.ok)
    throw new Error(
      "This recovery session is invalid or does not belong to an administrator. Request a new link.",
    );
}
export function ResetAdminPassword({ base }: { base: string }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("Checking your recovery link…");
  const [failed, setFailed] = useState(false);
  const initialization = useRef<Promise<void> | null>(null);
  useEffect(() => {
    let active = true;
    if (!initialization.current) {
      initialization.current = (async () => {
        const url = new URL(window.location.href);
        // Remove tokens from address/history before any further request or navigation.
        window.history.replaceState(null, "", window.location.pathname);
        const credentials = recoveryCredentials(url);
        const supabase = recoveryClient();
        const result =
          credentials.kind === "session"
            ? await supabase.auth.setSession({
                access_token: credentials.access_token,
                refresh_token: credentials.refresh_token,
              })
            : await supabase.auth.verifyOtp({
                token_hash: credentials.token_hash,
                type: "recovery",
              });
        if (result.error || !result.data.session)
          throw new Error(
            "This recovery link is invalid or expired. Request a new one.",
          );
        await authorizeRecovery("check");
      })();
    }
    initialization.current.then(
      () => {
        if (active) {
          setReady(true);
          setMessage("Choose a new password for your administrator account.");
        }
      },
      (error) => {
        if (active) {
          setFailed(true);
          setMessage(
            error instanceof Error
              ? error.message
              : "Could not verify this recovery link.",
          );
        }
      },
    );
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => router.replace(`${base}/login`), 2500);
    return () => clearTimeout(timer);
  }, [success, router, base]);
  return (
    <form
      className={s.form}
      aria-busy={busy || (!ready && !failed)}
      onSubmit={async (event) => {
        event.preventDefault();
        if (!ready || success) return;
        const form = event.currentTarget;
        const values = new FormData(form);
        const parsed = newPasswordSchema.safeParse({
          password: values.get("password"),
          confirmPassword: values.get("confirmPassword"),
        });
        if (!parsed.success) {
          setFailed(true);
          setMessage(parsed.error.issues[0].message);
          return;
        }
        setBusy(true);
        setFailed(false);
        try {
          // Remove any existing dashboard grant before changing the password.
          await authorizeRecovery("complete");
          const supabase = recoveryClient();
          const { error } = await supabase.auth.updateUser({
            password: parsed.data.password,
          });
          if (error) throw new Error(error.message);
          form.reset();
          setReady(false);
          await supabase.auth.signOut({ scope: "local" });
          setSuccess(true);
          setMessage(
            "Password updated successfully. Redirecting to admin sign in…",
          );
        } catch (error) {
          setFailed(true);
          setMessage(
            error instanceof Error
              ? error.message
              : "Could not update your password.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className={s.field}>
        New Password
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          className={s.input}
          disabled={!ready || busy || success}
        />
      </label>
      <label className={s.field}>
        Confirm New Password
        <Input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          className={s.input}
          disabled={!ready || busy || success}
        />
      </label>
      <Button className={s.submit} disabled={!ready || busy || success}>
        {busy ? "Updating…" : "Update Password"}
      </Button>
      <p
        role={failed ? "alert" : "status"}
        className={`${s.message} ${failed ? s.error : ""}`}
      >
        {message}
      </p>
      <Link
        href={`${base}${success ? "/login" : "/forgot-password"}`}
        className="text-center text-sm text-zinc-300 underline underline-offset-4"
      >
        {success ? "Continue to admin sign in" : "Request a new recovery link"}
      </Link>
    </form>
  );
}
