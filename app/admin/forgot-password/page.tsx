import { ForgotAdminPassword } from "@/components/admin-password-recovery";
import { Layers } from "lucide-react";
import { adminPath } from "@/lib/auth";
import s from "../login/login.module.css";
export const metadata = {
  title: "Admin password recovery",
  referrer: "no-referrer",
};
export default async function ForgotPassword() {
  return (
    <main className={s.page}>
      <div className={s.background} aria-hidden="true" />
      <section className={s.panel} aria-labelledby="recovery-title">
        <div className={s.mark} aria-hidden="true">
          <Layers size={27} />
        </div>
        <header className={s.heading}>
          <h1 id="recovery-title">Reset your admin password</h1>
          <p>We’ll email you a secure recovery link.</p>
        </header>
        <ForgotAdminPassword base={(await adminPath()).replace(/\/$/, "")} />
      </section>
    </main>
  );
}
