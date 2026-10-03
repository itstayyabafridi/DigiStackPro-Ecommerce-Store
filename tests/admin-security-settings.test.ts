import { beforeEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
const m = vi.hoisted(() => ({
  admin: vi.fn(),
  security: vi.fn(),
  issue: vi.fn(),
  send: vi.fn(),
  verify: vi.fn(),
  save: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requireAdmin: m.admin }));
vi.mock("@/lib/admin-security", () => ({
  adminSecurity: m.security,
  issueAdminGrant: m.issue,
}));
vi.mock("@/lib/supabase", () => ({
  authClient: async () => ({
    auth: { signInWithOtp: m.send, verifyOtp: m.verify },
  }),
}));
vi.mock("@/lib/db", () => ({ db: { setting: { upsert: m.save } } }));
vi.mock("@/lib/security", () => ({
  sameOrigin: vi.fn(),
  requestLimit: vi.fn(),
  errorMessage: (e: Error) => e.message,
}));
import { POST } from "@/app/api/admin/security/route";
const request = (data: object) =>
  new NextRequest("http://localhost/api/admin/security", {
    method: "POST",
    body: JSON.stringify(data),
  });
const user = { id: "owner", email: "owner@example.com" };
beforeEach(() => {
  vi.resetAllMocks();
  m.admin.mockResolvedValue(user);
  m.security.mockResolvedValue({
    emailVerificationEnabled: false,
    version: "v1",
  });
  m.send.mockResolvedValue({ error: null });
  m.verify.mockResolvedValue({ data: { user }, error: null });
});
describe("email verification settings", () => {
  it("leaves verification off until a code is confirmed", async () => {
    expect(await (await POST(request({ enabled: true }))).json()).toEqual({
      verificationRequired: true,
    });
    expect(m.save).not.toHaveBeenCalled();
  });
  it("does not change settings if delivery or verification fails", async () => {
    m.send.mockResolvedValue({ error: {} });
    expect((await POST(request({ enabled: true }))).status).toBe(400);
    m.verify.mockResolvedValue({ error: {}, data: { user: null } });
    expect(
      (await POST(request({ enabled: true, code: "123456" }))).status,
    ).toBe(400);
    expect(m.save).not.toHaveBeenCalled();
  });
  it("enables verification only after checking the owner code", async () => {
    expect(
      (await POST(request({ enabled: true, code: "123456" }))).status,
    ).toBe(200);
    expect(m.save).toHaveBeenCalledOnce();
    expect(m.issue).toHaveBeenCalledWith(user.id, expect.any(String), true);
  });
  it("cannot disable verification from an unauthorized session", async () => {
    m.admin.mockRejectedValue(new Error("Administrator access required."));
    expect((await POST(request({ enabled: false }))).status).toBe(400);
    expect(m.save).not.toHaveBeenCalled();
  });
});
