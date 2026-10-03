import { describe, it, expect } from "vitest";
import { readGrant, signGrant } from "../lib/admin-grant";
const key = "a".repeat(48);
const grant = {
  userId: "11111111-1111-4111-8111-111111111111",
  sessionId: "22222222-2222-4222-8222-222222222222",
  version: "v1",
  emailVerified: false,
  expires: 2000,
};
describe("admin session proof", () => {
  it("reads an intact unexpired proof", () => {
    expect(readGrant(signGrant(grant, key), key, 1000)).toEqual(grant);
  });
  it("rejects tampered verification status", () => {
    const signed = signGrant(grant, key);
    const payload = Buffer.from(
      JSON.stringify({ ...grant, emailVerified: true }),
    ).toString("base64url");
    expect(
      readGrant(payload + "." + signed.split(".")[1], key, 1000),
    ).toBeNull();
  });
  it("rejects expiration, wrong signing keys and malformed cookies", () => {
    expect(readGrant(signGrant(grant, key), key, 2000)).toBeNull();
    expect(readGrant(signGrant(grant, key), "b".repeat(48), 1000)).toBeNull();
    expect(readGrant("broken", key, 1000)).toBeNull();
  });
});
