import { beforeEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
const m = vi.hoisted(() => ({
  password: vi.fn(),
  send: vi.fn(),
  verify: vi.fn(),
  signOut: vi.fn(),
  identity: vi.fn(),
  security: vi.fn(),
  grant: vi.fn(),
  issue: vi.fn(),
  clear: vi.fn(),
  claim: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({
  authClient: async () => ({
    auth: {
      signInWithPassword: m.password,
      signInWithOtp: m.send,
      verifyOtp: m.verify,
      signOut: m.signOut,
    },
  }),
}));
vi.mock("@/lib/auth", () => ({
  requireAdminIdentity: m.identity,
  claimOrders: m.claim,
}));
vi.mock("@/lib/admin-security", () => ({
  adminSecurity: m.security,
  adminGrant: m.grant,
  issueAdminGrant: m.issue,
  clearAdminGrant: m.clear,
}));
vi.mock("@/lib/security", () => ({
  sameOrigin: vi.fn(),
  requestLimit: vi.fn(),
  rateLimit: vi.fn(),
  errorMessage: (e: Error) => e.message,
}));
import { POST } from "@/app/api/admin-login/route";
import { POST as customerLogin } from "@/app/api/auth/route";
const request = (data: object) =>
  new NextRequest("http://localhost/api/admin-login", {
    method: "POST",
    body: JSON.stringify(data),
  });
const credentials = {
  step: "password",
  email: "owner@example.com",
  password: "test-password",
};
const user = { id: "user", email: "owner@example.com" };
const verifyRequest = () => request({ step: "code", code: "123456" });
const security = { emailVerificationEnabled: false, version: "v1" };
beforeEach(() => {
  vi.resetAllMocks();
  m.password.mockResolvedValue({ error: null });
  m.send.mockResolvedValue({ error: null });
  m.verify.mockResolvedValue({ data: { user }, error: null });
  m.identity.mockResolvedValue(user);
  m.security.mockResolvedValue(security);
});
describe("admin password and email verification", () => {
  it("issues a password grant without emailing when verification is off", async () => {
    expect(await (await POST(request(credentials))).json()).toEqual({
      verified: true,
    });
    expect(m.issue).toHaveBeenCalledWith("user", "v1", false);
    expect(m.send).not.toHaveBeenCalled();
  });
  it("rejects invalid passwords without issuing a grant", async () => {
    m.password.mockResolvedValue({ error: {} });
    expect((await POST(request(credentials))).status).toBe(400);
    expect(m.issue).not.toHaveBeenCalled();
    expect(m.identity).not.toHaveBeenCalled();
  });
  it("rejects non-admin identities and clears their session", async () => {
    m.identity.mockRejectedValue(new Error("Administrator access required."));
    expect((await POST(request(credentials))).status).toBe(400);
    expect(m.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(m.issue).not.toHaveBeenCalled();
  });
  it("issues only a short pending grant when a code is required", async () => {
    m.security.mockResolvedValue({
      ...security,
      emailVerificationEnabled: true,
    });
    expect(
      (await (await POST(request(credentials))).json()).verificationRequired,
    ).toBe(true);
    expect(m.issue).toHaveBeenCalledWith("user", "v1", false, true);
    expect(m.send).toHaveBeenCalledWith({
      email: user.email,
      options: { shouldCreateUser: false },
    });
  });
  it("does not grant access when email delivery fails", async () => {
    m.security.mockResolvedValue({
      ...security,
      emailVerificationEnabled: true,
    });
    m.send.mockResolvedValue({ error: {} });
    expect((await POST(request(credentials))).status).toBe(400);
    expect(m.issue).not.toHaveBeenCalled();
    expect(m.signOut).toHaveBeenCalled();
  });
  it("rejects code-only login without password proof", async () => {
    m.security.mockResolvedValue({
      ...security,
      emailVerificationEnabled: true,
    });
    m.grant.mockResolvedValue(null);
    expect((await POST(verifyRequest())).status).toBe(400);
    expect(m.verify).not.toHaveBeenCalled();
  });
  it("requires a valid code after password proof", async () => {
    m.security.mockResolvedValue({
      ...security,
      emailVerificationEnabled: true,
    });
    m.grant.mockResolvedValue({ emailVerified: false });
    m.verify.mockResolvedValue({ data: { user: null }, error: {} });
    expect((await POST(verifyRequest())).status).toBe(400);
    expect(m.issue).not.toHaveBeenCalled();
  });
  it("issues verified access for the same user after both steps", async () => {
    m.security.mockResolvedValue({
      ...security,
      emailVerificationEnabled: true,
    });
    m.grant.mockResolvedValue({ emailVerified: false });
    expect((await POST(verifyRequest())).status).toBe(200);
    expect(m.issue).toHaveBeenCalledWith("user", "v1", true);
  });
  it("blocks the old admin OTP endpoint", async () => {
    expect(
      (
        await customerLogin(
          request({ email: user.email, code: "123456", admin: true }),
        )
      ).status,
    ).toBe(400);
    expect(m.verify).not.toHaveBeenCalled();
  });
  it("preserves customer email-code login", async () => {
    expect(
      (await customerLogin(request({ email: user.email, code: "123456" })))
        .status,
    ).toBe(200);
    expect(m.claim).toHaveBeenCalledOnce();
    expect(m.issue).not.toHaveBeenCalled();
  });
});
