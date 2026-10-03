import { beforeEach, describe, it, expect, vi } from "vitest";
import { signGrant } from "../lib/admin-grant";
const m = vi.hoisted(() => ({ get: vi.fn(), claims: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: m.get }) }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/supabase", () => ({
  authClient: async () => ({ auth: { getClaims: m.claims } }),
}));
import { adminGrant } from "../lib/admin-security";
const key = "a".repeat(48),
  userId = "11111111-1111-4111-8111-111111111111",
  sessionId = "22222222-2222-4222-8222-222222222222";
beforeEach(() => {
  vi.stubEnv("ADMIN_SESSION_SECRET", key);
  m.claims.mockResolvedValue({
    data: { claims: { sub: userId, session_id: sessionId } },
    error: null,
  });
  m.get.mockReturnValue({
    value: signGrant(
      {
        userId,
        sessionId,
        version: "v1",
        emailVerified: true,
        expires: Date.now() + 10000,
      },
      key,
    ),
  });
});
describe("admin grant binding", () => {
  it("accepts the original user, session and settings version", async () => {
    expect(await adminGrant(userId, "v1")).toMatchObject({
      emailVerified: true,
    });
  });
  it("rejects a different user or settings version", async () => {
    expect(
      await adminGrant("33333333-3333-4333-8333-333333333333", "v1"),
    ).toBeNull();
    expect(await adminGrant(userId, "v2")).toBeNull();
  });
  it("rejects replay in a new Supabase session", async () => {
    m.claims.mockResolvedValue({
      data: {
        claims: {
          sub: userId,
          session_id: "44444444-4444-4444-8444-444444444444",
        },
      },
      error: null,
    });
    expect(await adminGrant(userId, "v1")).toBeNull();
  });
});
