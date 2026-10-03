import { describe, it, expect } from "vitest";
import { recoveryCredentials, newPasswordSchema } from "../lib/admin-recovery";
describe("admin recovery link and password validation", () => {
  it("accepts recovery fragments without depending on cookies", () => {
    expect(
      recoveryCredentials(
        new URL(
          "http://admin.localhost:3000/admin/reset-password#type=recovery&access_token=access&refresh_token=refresh",
        ),
      ),
    ).toEqual({
      kind: "session",
      access_token: "access",
      refresh_token: "refresh",
    });
  });
  it("supports explicit recovery token-hash templates", () => {
    expect(
      recoveryCredentials(
        new URL(
          "https://admin.example.com/admin/reset-password?type=recovery&token_hash=hash",
        ),
      ),
    ).toEqual({ kind: "hash", token_hash: "hash" });
  });
  it("rejects ordinary sign-in, missing tokens, expired links and foreign PKCE links", () => {
    for (const suffix of [
      "",
      "#type=signup&access_token=access&refresh_token=refresh",
      "#type=recovery&access_token=access",
      "#error=access_denied&error_code=otp_expired",
      "?code=unrelated",
    ])
      expect(() =>
        recoveryCredentials(
          new URL("http://localhost:3000/admin/reset-password" + suffix),
        ),
      ).toThrow();
  });
  it("requires matching passwords of sufficient length", () => {
    expect(
      newPasswordSchema.safeParse({
        password: "long-password",
        confirmPassword: "long-password",
      }).success,
    ).toBe(true);
    expect(
      newPasswordSchema.safeParse({
        password: "short",
        confirmPassword: "short",
      }).success,
    ).toBe(false);
    expect(
      newPasswordSchema.safeParse({
        password: "long-password",
        confirmPassword: "different-password",
      }).success,
    ).toBe(false);
  });
});
