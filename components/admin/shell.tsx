"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Folder,
  Globe,
  Home,
  Layers,
  Menu,
  Search,
  Settings,
  ShoppingCart,
  Tag,
  Workflow,
  X,
} from "lucide-react";
import { Logout } from "@/components/login";
import s from "./admin.module.css";
export function AdminShell({
  children,
  base,
  siteName,
  userName,
  pending,
  storeUrl,
}: {
  children: React.ReactNode;
  base: string;
  siteName: string;
  userName: string;
  pending: number;
  storeUrl: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const search = useRef<HTMLInputElement>(null);
  const links = [
    { label: "Home", path: "", icon: Home },
    { label: "Orders", path: "/orders", icon: ShoppingCart },
    { label: "Products", path: "/products", icon: Tag },
    { label: "Categories", path: "/categories", icon: Folder },
    { label: "Coupons", path: "/coupons", icon: Layers },
    { label: "Funnels", path: "/funnels", icon: Workflow },
  ];
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        search.current?.focus();
      }
      if (e.key === "Escape") {
        if (document.activeElement?.closest("#admin-search-results"))
          search.current?.focus();
        if (document.activeElement?.closest("#admin-sidebar"))
          document
            .querySelector<HTMLButtonElement>(
              'button[aria-controls="admin-sidebar"]',
            )
            ?.focus();
        setQuery("");
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const results = [
    ...links,
    { label: "Settings", path: "/settings", icon: Settings },
  ].filter((l) => l.label.toLowerCase().includes(query.toLowerCase()));
  const initials = userName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((v) => v[0])
    .join("")
    .toUpperCase();
  const href = (path: string) => `${base}${path || "/"}`;
  return (
    <div className={s.shell}>
      <a className={s.skip} href="#admin-main">
        Skip to content
      </a>
      <header className={s.header}>
        <div className={s.brandArea}>
          <button
            className={`${s.iconButton} ${s.mobileToggle}`}
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="admin-sidebar"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <details className={s.storeMenu}>
            <summary>
              <Layers size={34} strokeWidth={1.8} />
              <strong>{siteName}</strong>
              <ChevronDown size={15} />
            </summary>
            <div className={s.headerMenu}>
              <a href={storeUrl}>
                <Globe size={16} />
                View storefront
              </a>
              <Link href={href("/settings")}>
                <Settings size={16} />
                Store settings
              </Link>
            </div>
          </details>
        </div>
        <div className={s.searchWrap}>
          <Search size={18} aria-hidden="true" />
          <input
            ref={search}
            aria-label="Search admin pages"
            placeholder="Search admin pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                document
                  .getElementById("admin-search-results")
                  ?.querySelector("a")
                  ?.focus();
              }
            }}
          />
          <kbd>⌘ K</kbd>
          {query && (
            <div
              id="admin-search-results"
              className={s.searchResults}
              aria-label="Search results"
            >
              {results.length ? (
                results.map((r) => (
                  <Link
                    key={r.label}
                    href={href(r.path)}
                    onClick={() => setQuery("")}
                  >
                    <r.icon size={17} />
                    {r.label}
                    <ChevronRight size={14} />
                  </Link>
                ))
              ) : (
                <p>No pages found. Try “Orders” or “Products”.</p>
              )}
            </div>
          )}
        </div>
        <div className={s.headerActions}>
          <Link
            href={href("/orders?status=pending")}
            className={s.iconButton}
            aria-label={`${pending} orders awaiting review`}
          >
            <Bell size={20} />
            {pending > 0 && <span className={s.notificationDot} />}
          </Link>
          <details className={s.account}>
            <summary>
              <span className={s.avatar}>{initials || "A"}</span>
              <span className={s.userName}>{userName}</span>
              <ChevronDown size={14} />
            </summary>
            <div className={s.headerMenu}>
              <p>
                Signed in as
                <br />
                <strong>{userName}</strong>
              </p>
              <Logout />
            </div>
          </details>
          <Link className={s.newProduct} href={href("/products/new")}>New product</Link>
        </div>
      </header>
      <aside
        id="admin-sidebar"
        className={`${s.sidebar} ${open ? s.sidebarOpen : ""}`}
      >
        <nav aria-label="Admin navigation">
          <div className={s.navGroup}>
            {links.map((l) => {
              const active = l.path
                ? pathname === href(l.path) ||
                  pathname.startsWith(href(l.path) + "/")
                : pathname === href("") || pathname === base;
              return (
                <Link
                  key={l.label}
                  href={href(l.path)}
                  className={`${s.navLink} ${active ? s.navActive : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  <l.icon size={20} strokeWidth={1.8} />
                  <span>{l.label}</span>
                  {l.label === "Orders" && pending > 0 && (
                    <span className={s.count}>{pending}</span>
                  )}
                </Link>
              );
            })}
          </div>
          <div className={s.navSectionLabel}>
            Sales channels
            <ChevronRight size={15} />
          </div>
          <a className={s.navLink} href={storeUrl}>
            <Globe size={20} />
            <span>Online store</span>
          </a>
        </nav>
        <Link
          href={href("/settings")}
          className={`${s.navLink} ${s.settingsLink} ${pathname === href("/settings") ? s.navActive : ""}`}
          aria-current={pathname === href("/settings") ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          <Settings size={20} />
          <span>Settings</span>
        </Link>
      </aside>
      <main id="admin-main" className={s.main}>
        {children}
      </main>
    </div>
  );
}
