import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  createSignedUrl: vi.fn(),
  security: vi.fn(),
  grant: vi.fn(),
}));
vi.mock("@/lib/admin-security", () => ({
  adminSecurity: mocks.security,
  adminGrant: mocks.grant,
}));
vi.mock("@/lib/supabase", () => ({
  authClient: async () => ({ auth: { getUser: mocks.getUser } }),
  storage: () => ({
    storage: { from: () => ({ createSignedUrl: mocks.createSignedUrl }) },
  }),
}));
vi.mock("@/lib/db", () => ({
  db: {
    customer: { findUnique: mocks.findUnique },
    orderItem: { findFirst: mocks.findFirst },
  },
}));
import { requireAdmin } from "@/lib/auth";
import { GET } from "@/app/api/download/[itemId]/route";
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test-instance.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-public-key");
});
describe("server authorization boundaries", () => {
  it("requires password proof even if email verification is off", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user", email_confirmed_at: "2026-01-01" } },
    });
    mocks.findUnique.mockResolvedValue({ role: "admin" });
    mocks.security.mockResolvedValue({
      emailVerificationEnabled: false,
      version: "v1",
    });
    mocks.grant.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toThrow("Administrator");
  });
  it("blocks a pending second step on every protected admin entry", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user", email_confirmed_at: "2026-01-01" } },
    });
    mocks.findUnique.mockResolvedValue({ role: "admin" });
    mocks.security.mockResolvedValue({
      emailVerificationEnabled: true,
      version: "v1",
    });
    mocks.grant.mockResolvedValue({ emailVerified: false });
    await expect(requireAdmin()).rejects.toThrow("Administrator");
    mocks.grant.mockResolvedValue({ emailVerified: true });
    await expect(requireAdmin()).resolves.toMatchObject({ id: "user" });
  });
  it("does not trust an admin role in user-editable auth metadata", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user",
          email_confirmed_at: "2026-01-01",
          user_metadata: { role: "admin" },
        },
      },
    });
    mocks.findUnique.mockResolvedValue({ role: "customer" });
    await expect(requireAdmin()).rejects.toThrow("Administrator");
  });
  it("rejects an unverified email even with an admin database role", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user" } } });
    mocks.findUnique.mockResolvedValue({ role: "admin" });
    await expect(requireAdmin()).rejects.toThrow("Administrator");
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
  it("requires authenticated ownership and approval before signing a download", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "owner", email_confirmed_at: "2026-01-01" } },
    });
    mocks.findFirst.mockResolvedValue(null);
    const id = "11111111-1111-4111-8111-111111111111";
    const result = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ itemId: id }),
    });
    expect(result.status).toBe(404);
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: { id, order: { customerId: "owner", status: "approved" } },
    });
    expect(mocks.createSignedUrl).not.toHaveBeenCalled();
  });
  it("signs owned approved downloads for 24 hours and disables caching", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "owner", email_confirmed_at: "2026-01-01" } },
    });
    mocks.findFirst.mockResolvedValue({ filePath: "assets/private.zip" });
    mocks.createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://storage.example/signed" },
      error: null,
    });
    const result = await GET(new Request("http://localhost"), {
      params: Promise.resolve({
        itemId: "11111111-1111-4111-8111-111111111111",
      }),
    });
    expect(result.status).toBe(307);
    expect(result.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.createSignedUrl).toHaveBeenCalledWith(
      "assets/private.zip",
      86400,
      { download: true },
    );
  });
});
