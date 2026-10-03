import { ResetAdminPassword } from "@/components/admin-password-recovery";
import { Layers } from "lucide-react";
import { adminPath } from "@/lib/auth";
import s from "../login/login.module.css";
export const metadata = {
  title: "Set a new admin password",
  referrer: "no-referrer",
};
export default async function ResetPassword() {
  return (
    <main className={s.page}>
      <div className={s.background} aria-hidden="true" />
      <section className={s.panel} aria-labelledby="reset-title">
        <div className={s.mark} aria-hidden="true">
          <Layers size={27} />
        </div>
        <header className={s.heading}>
          <h1 id="reset-title">Set a new password</h1>
          <p>Recover access to your administrator account.</p>
        </header>
        <ResetAdminPassword base={(await adminPath()).replace(/\/$/, "")} />
      </section>
    </main>
  );
}
