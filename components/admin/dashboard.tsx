"use client";
import Link from "next/link";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronDown,
  Package,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { AssetImage } from "@/components/asset-image";
import { money } from "@/lib/utils";
import type { DashboardData } from "@/lib/dashboard-metrics";
import s from "./admin.module.css";
function coordinates(values: number[], width: number, height: number, pad = 5) {
  const max = Math.max(...values, 1);
  return values
    .map(
      (v, i) =>
        `${pad + (i * (width - pad * 2)) / Math.max(values.length - 1, 1)},${height - pad - (v / max) * (height - pad * 2)}`,
    )
    .join(" ");
}
function Sparkline({ values }: { values: number[] }) {
  const id = useId();
  const points = coordinates(values, 94, 38);
  return (
    <svg className={s.sparkline} viewBox="0 0 94 38" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity=".16" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`5,38 ${points} 89,38`} fill={`url(#${id})`} />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function Change({
  value,
  inverse = false,
}: {
  value: number | null;
  inverse?: boolean;
}) {
  if (value === null)
    return <span className={s.comparison}>No previous data</span>;
  const positive = inverse ? value <= 0 : value >= 0;
  const Icon = value < 0 ? ArrowDown : ArrowUp;
  return (
    <span className={positive ? s.increase : s.decrease}>
      <Icon size={16} />
      {Math.abs(value)}%
      <span className="sr-only">
        {value < 0 ? " decrease" : " increase"} versus previous period
      </span>
    </span>
  );
}
function ProductThumb({ src, title }: { src: string; title: string }) {
  return (
    <div className={s.productThumb}>
      {src ? <AssetImage src={src} alt={title} /> : <Package size={22} />}
    </div>
  );
}
export function AdminDashboard({
  data,
  base,
}: {
  data: DashboardData;
  base: string;
}) {
  const router = useRouter();
  const [metric, setMetric] = useState<"sales" | "orders">("sales");
  const [switching, setSwitching] = useState(false);
  const gradient = useId();
  const cards = [
    {
      label: "Total sales",
      key: "sales" as const,
      value: money(data.stats.sales),
    },
    {
      label: "Orders",
      key: "orders" as const,
      value: data.stats.orders.toLocaleString(),
    },
    {
      label: "Customers",
      key: "customers" as const,
      value: data.stats.customers.toLocaleString(),
    },
    {
      label: "Awaiting review",
      key: "pending" as const,
      value: data.stats.pending.toLocaleString(),
    },
  ];
  const values = data.series.map((d) => d[metric]);
  const peak = Math.max(...values, metric === "sales" ? 10000 : 1);
  const maximum =
    metric === "sales" ? Math.ceil(peak / 10000) * 10000 : Math.ceil(peak);
  const plot = values
    .map(
      (v, i) =>
        `${(i * 660) / Math.max(values.length - 1, 1)},${180 - (v / maximum) * 180}`,
    )
    .join(" ");
  const dateLabel = (date: string) =>
    new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(date));
  const formatAxis = (v: number) =>
    metric === "sales"
      ? new Intl.NumberFormat("en", {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(v / 100)
      : v.toLocaleString();
  return (
    <div className={s.dashboard} aria-busy={switching}>
      <div className={s.pageHeading}>
        <h1>Home</h1>
        <label className={s.dateFilter}>
          <CalendarDays size={17} />
          <span className="sr-only">Reporting period</span>
          <select
            value={data.days}
            disabled={switching}
            onChange={(e) => {
              setSwitching(true);
              router.push(`${base || "/"}?days=${e.target.value}`);
            }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <ChevronDown size={15} />
        </label>
      </div>
      <div className={s.metrics}>
        {cards.map((c) => (
          <Card key={c.key} className={s.metricCard}>
            <p>{c.label}</p>
            <strong title={String(c.value)}>{c.value}</strong>
            <div className={s.metricBottom}>
              <Change
                value={data.changes[c.key]}
                inverse={c.key === "pending"}
              />
              <Sparkline values={data.series.map((d) => d[c.key])} />
            </div>
          </Card>
        ))}
      </div>
      <div className={s.middleGrid}>
        <Card className={s.salesCard}>
          <div className={s.cardHeading}>
            <h2>
              {metric === "sales" ? "Sales over time" : "Orders over time"}
            </h2>
            <label className={s.metricSelect}>
              <span className="sr-only">Chart metric</span>
              <select
                value={metric}
                onChange={(e) =>
                  setMetric(e.target.value as "sales" | "orders")
                }
              >
                <option value="sales">Total sales</option>
                <option value="orders">Orders</option>
              </select>
              <ChevronDown size={14} />
            </label>
          </div>
          <div className={s.chartTotal}>
            <strong>
              {metric === "sales" ? money(data.stats.sales) : data.stats.orders}
            </strong>
            <Change value={data.changes[metric]} />
          </div>
          <div
            className={s.chart}
            role="img"
            aria-label={`${metric === "sales" ? "Approved sales in PKR" : "Submitted orders"} over the last ${data.days} days. ${values.some(Boolean) ? "Exact values are available in the chart data table below." : "No activity in this period."}`}
          >
            <div className={s.yAxis}>
              {[maximum, maximum / 2, 0].map((v, i) => (
                <span key={i}>
                  {metric === "sales" ? "Rs " : ""}
                  {formatAxis(v)}
                </span>
              ))}
            </div>
            <div className={s.plot}>
              <svg
                viewBox="0 0 660 180"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="currentColor"
                      stopOpacity=".2"
                    />
                    <stop
                      offset="100%"
                      stopColor="currentColor"
                      stopOpacity=".015"
                    />
                  </linearGradient>
                </defs>
                {[0, 90, 180].map((y) => (
                  <line
                    key={`h${y}`}
                    x1="0"
                    x2="660"
                    y1={y}
                    y2={y}
                    className={s.gridLine}
                  />
                ))}
                {[0, 110, 220, 330, 440, 550, 660].map((x) => (
                  <line
                    key={`v${x}`}
                    x1={x}
                    x2={x}
                    y1="0"
                    y2="180"
                    className={s.gridLine}
                  />
                ))}
                <polygon
                  points={`0,180 ${plot} 660,180`}
                  fill={`url(#${gradient})`}
                />
                <polyline
                  points={plot}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div className={s.xAxis}>
                {[0, Math.floor((data.days - 1) / 2), data.days - 1].map(
                  (i) => (
                    <span key={i}>{dateLabel(data.series[i].date)}</span>
                  ),
                )}
              </div>
            </div>
          </div>
          <div className={s.chartFooter}>
            <span>By order date · UTC · Approved sales, net of discounts</span>
            <details>
              <summary>View chart data</summary>
              <div className={s.chartData}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Sales (PKR)</th>
                      <th>Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.series.map((d) => (
                      <tr key={d.date}>
                        <td>{d.date}</td>
                        <td>{money(d.sales)}</td>
                        <td>{d.orders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        </Card>
        <Card className={s.topCard}>
          <div className={s.cardHeading}>
            <h2>Top products</h2>
            <Link href={`${base}/products`}>
              View all<span className="sr-only"> products</span>
            </Link>
          </div>
          {data.products.length ? (
            <ul className={s.topProducts}>
              {data.products.map((p) => (
                <li key={p.id}>
                  <ProductThumb src={p.thumbnailUrl} title={p.title} />
                  <div>
                    <Link href={`${base}/products/${p.id}`}>{p.title}</Link>
                    <span>
                      {p.orders} {p.orders === 1 ? "order" : "orders"}
                    </span>
                  </div>
                  <strong>{money(p.revenue)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <Empty
              title="Your best sellers will appear here"
              body="Approve your first paid order to see product performance."
            />
          )}
        </Card>
      </div>
      <div className={s.bottomGrid}>
        <Card className={s.tableCard}>
          <div className={s.cardHeading}>
            <h2>Recent orders</h2>
            <Link href={`${base}/orders`}>
              View all<span className="sr-only"> orders</span>
            </Link>
          </div>
          <div
            className={s.tableScroll}
            tabIndex={0}
            role="region"
            aria-label="Recent orders"
          >
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Products</th>
                  <th className={s.numeric}>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link
                        className={s.orderLink}
                        href={`${base}/orders/${o.id}`}
                      >
                        #{o.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td>{o.name}</td>
                    <td className={s.productCell}>{o.products}</td>
                    <td className={s.numeric}>{money(o.total)}</td>
                    <td>
                      <span
                        className={`${s.badge} ${o.status === "approved" ? s.approved : o.status === "rejected" ? s.rejected : s.pending}`}
                      >
                        {o.status === "approved"
                          ? "Approved"
                          : o.status === "pending"
                            ? "Pending"
                            : "Rejected"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.recent.length && (
              <Empty
                title="No orders in this period"
                body="Submitted customer orders will appear here."
              />
            )}
          </div>
        </Card>
        <Card className={s.tableCard}>
          <div className={s.cardHeading}>
            <h2>Digital product sales</h2>
            <Link href={`${base}/products`}>
              View all<span className="sr-only"> digital products</span>
            </Link>
          </div>
          <div
            className={s.tableScroll}
            tabIndex={0}
            role="region"
            aria-label="Digital product sales"
          >
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th className={s.numeric}>Purchases</th>
                  <th className={s.numeric}>Net revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link
                        href={`${base}/products/${p.id}`}
                        className={s.productRow}
                      >
                        <ProductThumb src={p.thumbnailUrl} title={p.title} />
                        <span>{p.title}</span>
                      </Link>
                    </td>
                    <td className={s.numeric}>{p.orders}</td>
                    <td className={s.numeric}>{money(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.products.length && (
              <Empty
                title="No approved purchases yet"
                body="Revenue and purchased files will be listed after approval."
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className={s.empty}>
      <Package size={25} strokeWidth={1.5} />
      <p>{title}</p>
      <span>{body}</span>
    </div>
  );
}
