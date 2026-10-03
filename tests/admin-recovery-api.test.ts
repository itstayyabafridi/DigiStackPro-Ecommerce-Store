import { beforeEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
const m = vi.hoisted(() => ({
  user: vi.fn(),
  account: vi.fn(),
  clear: vi.fn(),
  origin: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser: m.user } }),
}));
vi.mock("@/lib/env", () => ({
  supabaseEnv: () => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-key",
  }),
}));
vi.mock("@/lib/db", () => ({ db: { customer: { findUnique: m.account } } }));
vi.mock("@/lib/security", () => ({
  sameOrigin: m.origin,
  requestLimit: vi.fn(),
}));
vi.mock("@/lib/admin-security", () => ({ clearAdminGrant: m.clear }));
import { POST } from "@/app/api/admin-recovery/route";
const request = (action = "check", token = "test-token") =>
  new NextRequest("http://localhost/api/admin-recovery", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify({ action }),
  });
beforeEach(() => {
  vi.resetAllMocks();
  m.user.mockResolvedValue({
    data: { user: { id: "existing-admin", email_confirmed_at: "2026-01-01" } },
    error: null,
  });
  m.account.mockResolvedValue({ role: "admin" });
});
describe("recovery identity checks", () => {
  it("validates the existing admin without requiring a dashboard or second-step grant", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(m.user).toHaveBeenCalledWith("test-token");
    expect(m.clear).not.toHaveBeenCalled();
  });
  it("rejects missing, invalid and non-admin sessions", async () => {
    expect((await POST(request("check", ""))).status).toBe(403);
    m.user.mockResolvedValue({ data: { user: null }, error: {} });
    expect((await POST(request())).status).toBe(403);
    m.user.mockResolvedValue({
      data: { user: { id: "customer", email_confirmed_at: "yes" } },
      error: null,
    });
    m.account.mockResolvedValue({ role: "customer" });
    expect((await POST(request())).status).toBe(403);
  });
  it("clears only the application admin grant and never creates a login grant", async () => {
    const response = await POST(request("complete"));
    expect(response.status).toBe(200);
    expect(m.clear).toHaveBeenCalledOnce();
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("rejects cross-origin recovery requests", async () => {
    m.origin.mockRejectedValue(new Error("Invalid origin"));
    expect((await POST(request())).status).toBe(403);
    expect(m.user).not.toHaveBeenCalled();
  });
});
