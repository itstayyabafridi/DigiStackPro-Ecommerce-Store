import { test, expect } from "@playwright/test";
test("storefront renders and navigation works", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A head start, ready to download." }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("storefront.png"),
    fullPage: true,
    caret: "initial",
  });
  await page.getByRole("link", { name: "Cart", exact: true }).click();
  await expect(page.getByText("Your cart is empty.")).toBeVisible();
  await page.getByRole("link", { name: "My Orders", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Email me a code" }),
  ).toBeVisible();
});
test("checkout needs configured payment methods", async ({ page }) => {
  await page.goto("/checkout");
  await expect(
    page.getByRole("button", { name: "Review order and pay" }),
  ).toBeDisabled();
});
test("admin is protected on path and subdomain", async ({ page }, testInfo) => {
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Store administration" }),
  ).toBeVisible();
  await page.goto("http://admin.localhost:3000/");
  await expect(
    page.getByRole("heading", { name: "Store administration" }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("admin-login.png"),
    fullPage: true,
    caret: "initial",
  });
});
test("unauthenticated admin mutation and cross-origin requests fail", async ({
  request,
}) => {
  const response = await request.post("/api/admin", {
    headers: { Origin: "http://localhost:3000" },
    data: { action: "settings", data: { siteName: "Changed" } },
  });
  expect(response.ok()).toBe(false);
  const cross = await request.post("/api/admin", {
    headers: { Origin: "https://evil.example" },
    data: { action: "settings", data: { siteName: "Changed" } },
  });
  expect(cross.ok()).toBe(false);
});
test("no horizontal overflow on the storefront", async ({ page }) => {
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
