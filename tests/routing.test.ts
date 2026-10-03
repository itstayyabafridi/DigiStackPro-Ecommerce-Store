import { describe, expect, it, vi, afterEach } from "vitest";
import { routeHost } from "@/lib/routing";
afterEach(() => vi.unstubAllEnvs());
describe("domain routing", () => {
  it.each([
    "admin.digistackpro.store",
    "admin.localhost:3000",
    "ADMIN.EXAMPLE.COM:443",
  ])("rewrites admin host %s", (host) => {
    expect(routeHost(host, "/products", "digistackpro.store")).toEqual({
      kind: "admin",
      path: "/admin/products",
    });
  });
  it("does not duplicate the admin prefix", () => {
    expect(routeHost("admin.localhost:3000", "/admin/orders").path).toBe(
      "/admin/orders",
    );
  });
  it("supports an explicitly configured non-admin hostname", () => {
    vi.stubEnv("ADMIN_HOST", "backoffice.example.com");
    expect(routeHost("backoffice.example.com", "/").kind).toBe("admin");
  });
  it.each(["/admin", "/admin/", "/admin/orders"])(
    "blocks root domain path %s",
    (path) => {
      expect(
        routeHost("digistackpro.store", path, "digistackpro.store").kind,
      ).toBe("blocked");
    },
  );
  it.each([
    "localhost:3000",
    "digistackpro.vercel.app",
    "preview-123.vercel.app",
  ])("keeps path admin on %s", (host) => {
    expect(routeHost(host, "/admin/orders", "digistackpro.store")).toEqual({
      kind: "store",
      path: "/admin/orders",
    });
  });
  it("does not block similar unrelated path names", () => {
    expect(
      routeHost("digistackpro.store", "/administrator", "digistackpro.store")
        .kind,
    ).toBe("store");
  });
});
