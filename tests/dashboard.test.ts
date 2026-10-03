import { describe, it, expect, vi, afterEach } from "vitest";
import {
  dashboardMetrics,
  reportingWindow,
  type DashboardOrder,
} from "../lib/dashboard-metrics";
import { databaseConfigured, authConfigured } from "../lib/config";
afterEach(() => vi.unstubAllEnvs());
const now = new Date("2026-10-01T12:00:00Z");
const order = (changes: Partial<DashboardOrder> = {}): DashboardOrder => ({
  id: "o1",
  name: "Customer",
  email: "a@example.com",
  status: "approved",
  total: 101,
  subtotal: 300,
  createdAt: now,
  items: [
    {
      productId: "p1",
      title: "First",
      price: 100,
      product: { title: "First", thumbnailUrl: "" },
    },
    {
      productId: "p2",
      title: "Second",
      price: 200,
      product: { title: "Second", thumbnailUrl: "" },
    },
  ],
  ...changes,
});
describe("dashboard reporting", () => {
  it("uses UTC calendar boundaries and excludes orders outside the period", () => {
    expect(reportingWindow(7, now).start.toISOString()).toBe(
      "2026-09-25T00:00:00.000Z",
    );
    const data = dashboardMetrics(
      [
        order(),
        order({ id: "old", createdAt: new Date("2026-09-24T23:59:59Z") }),
        order({ id: "future", createdAt: new Date("2026-10-02T00:00:00Z") }),
      ],
      7,
      now,
    );
    expect(data.stats.sales).toBe(101);
    expect(data.stats.orders).toBe(1);
    expect(data.changes.sales).toBe(0);
    expect(data.series).toHaveLength(7);
  });
  it("counts submitted customers once and only approved revenue", () => {
    const data = dashboardMetrics(
      [
        order(),
        order({ id: "pending", email: "A@example.com", status: "pending" }),
        order({ id: "rejected", status: "rejected" }),
      ],
      7,
      now,
    );
    expect(data.stats).toEqual({
      sales: 101,
      orders: 3,
      customers: 1,
      pending: 1,
    });
    expect(data.products.reduce((n, p) => n + p.revenue, 0)).toBe(101);
    expect(data.products.map((p) => p.revenue)).toEqual([68, 33]);
  });
  it("returns honest empty data without invented trends", () => {
    const data = dashboardMetrics([], 30, now);
    expect(data.stats.sales).toBe(0);
    expect(data.changes.sales).toBeNull();
    expect(data.products).toEqual([]);
    expect(data.series.every((d) => d.sales === 0)).toBe(true);
  });
});
describe("setup detection", () => {
  it("accepts a real Supabase pooler hostname", () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://postgres.realref:encoded-secret@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    );
    expect(databaseConfigured()).toBe(true);
  });
  it("rejects example URLs and missing authentication keys", () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://postgres.PROJECT:PASSWORD@POOLER:6543/postgres",
    );
    expect(databaseConfigured()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://PROJECT.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "example");
    expect(authConfigured()).toBe(false);
  });
  it("accepts configured local connections", () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://postgres:local-secret@localhost:5432/postgres",
    );
    expect(databaseConfigured()).toBe(true);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "local-key");
    expect(authConfigured()).toBe(true);
  });
});
