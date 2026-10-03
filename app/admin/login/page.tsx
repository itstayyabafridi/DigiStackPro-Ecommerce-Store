import { AdminLogin as AdminLoginForm } from "@/components/admin-login";
import { adminPath } from "@/lib/auth";
import { headers } from "next/headers";
import { Download, Layers } from "lucide-react";
import { isAdminHost } from "@/lib/routing";
import { getSettings } from "@/lib/settings";
import styles from "./login.module.css";
import { authConfigured, databaseConfigured } from "@/lib/config";

export default async function AdminLogin() {
  const settings = await getSettings();
  const host = (await headers()).get("host") ?? "localhost:3000";
  const storeHost = host.startsWith("admin.")
    ? host.slice(6)
    : process.env.ROOT_DOMAIN || host;
  const home = isAdminHost(host)
    ? process.env.SITE_URL ||
      `${host.includes("localhost") ? "http" : "https"}://${storeHost}`
    : "/";
  return (
    <main className={`${styles.page} ${styles.loginPage}`}>
      <div className={styles.background} aria-hidden="true" />
      <a className={styles.home} href={home}>
        <Layers size={34} aria-hidden="true" /> <strong>{settings.siteName}</strong>
      </a>
      <section className={styles.panel} aria-labelledby="admin-login-title">
        
        <header className={styles.heading}>
          <h1 id="admin-login-title">Store administration</h1>
          <p>
            Sign in to <span>{settings.siteName}</span>.
          </p>
        </header>
        {!authConfigured() || !databaseConfigured() ? (
          <div role="status" className={styles.setup}>
            <h2>Finish connecting your store</h2>
            <p>
              Replace the example database URLs and add your Supabase URL and
              public key in <code>.env</code>. Then follow the README to run
              migrations and create your administrator.
            </p>
          </div>
        ) : (
          <AdminLoginForm destination={await adminPath()} />
        )}
        <p className={styles.note}>
          A private space for your store. Access is limited to administrators.
        </p>
      </section>
      <aside className={styles.creative} aria-label="Digital resources for your next project">
        <div className={styles.collage} aria-hidden="true">
          <div className={styles.ideaCard}><Layers size={46} /><strong>Ideas<br />in the<br />making.</strong></div>
          <div className={styles.typeCard}><b>Aa</b><strong>Make it yours.</strong></div>
          <div className={styles.designCard}>DESIGN<br />YOUR<br />NEXT.</div>
          <div className={styles.downloadCard}><Download size={34} /><span>Download<br />Create<br />Grow</span></div>
        </div>
        <div className={styles.creativeCopy}><h2>A head start,<br />ready to download.</h2><p>Practical templates, creative assets, and useful tools for your next project. Pay locally. Get your files after payment approval.</p></div>
      </aside>
    </main>
  );
}
